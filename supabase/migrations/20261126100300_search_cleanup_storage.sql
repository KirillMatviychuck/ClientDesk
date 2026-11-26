-- Client search indexes, orphan workspace cleanup and the logo bucket.

-- ---------------------------------------------------------------------------
-- Client search (CLI-3): case-insensitive substring search on name, email and
-- contact name. Trigram GIN indexes serve `ilike '%term%'`.
-- ---------------------------------------------------------------------------
create extension if not exists pg_trgm with schema extensions;

create index clients_name_trgm_idx
  on public.clients using gin (name extensions.gin_trgm_ops);
create index clients_email_trgm_idx
  on public.clients using gin (email extensions.gin_trgm_ops);
create index client_contacts_name_trgm_idx
  on public.client_contacts using gin (name extensions.gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- Deleting an auth user deletes the workspaces they own (D8: one personal
-- workspace per user). Without this the workspace stays with no members and
-- nobody can reach it. Deleting the workspace cascades to all its data.
--
-- security definer: runs inside the auth.users delete (admin API, demo
-- cleanup job), where there is no end-user session. Not executable by API
-- roles; only the trigger calls it.
-- ---------------------------------------------------------------------------
create function public.handle_user_deleted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.workspaces w
  using public.workspace_members m
  where m.workspace_id = w.id
    and m.user_id = old.id
    and m.role = 'owner';
  return old;
end;
$$;

revoke execute on function public.handle_user_deleted() from public, anon, authenticated;

create trigger on_auth_user_deleted
  before delete on auth.users
  for each row execute function public.handle_user_deleted();

-- ---------------------------------------------------------------------------
-- Logo storage (AUTH-5). Private bucket; files live under the workspace id:
-- `{workspace_id}/logo.{png|jpg|webp}`. The app reads them with signed URLs.
-- No SVG: an SVG can carry scripts.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos', 'logos', false, 1048576, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- True if the first folder of an object path is a workspace the caller belongs
-- to. CASE guarantees the uuid cast only runs on a valid uuid.
create function public.is_workspace_folder_member(object_name text)
returns boolean
language sql
stable
set search_path = ''
as $$
  select case
    when (storage.foldername(object_name))[1]
         ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then public.is_workspace_member(((storage.foldername(object_name))[1])::uuid)
    else false
  end;
$$;

revoke execute on function public.is_workspace_folder_member(text) from public, anon;
grant execute on function public.is_workspace_folder_member(text) to authenticated;

-- The logo is a workspace setting, so the rule matches workspaces: any member.
create policy "logos: members read"
  on storage.objects for select to authenticated
  using (bucket_id = 'logos' and public.is_workspace_folder_member(name));

create policy "logos: members upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and public.is_workspace_folder_member(name));

create policy "logos: members replace"
  on storage.objects for update to authenticated
  using (bucket_id = 'logos' and public.is_workspace_folder_member(name))
  with check (bucket_id = 'logos' and public.is_workspace_folder_member(name));

create policy "logos: members delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and public.is_workspace_folder_member(name));

-- logo_path must point into the workspace's own folder.
alter table public.workspaces
  add constraint workspaces_logo_path_in_own_folder
  check (logo_path is null or logo_path like id::text || '/%');
