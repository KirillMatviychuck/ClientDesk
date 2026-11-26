-- On sign-up (including anonymous demo sign-ins): create the profile, a
-- personal workspace and the owner membership, in one transaction with the
-- auth.users insert. If any step fails, the sign-up fails.
--
-- security definer is required because the new user has no rights yet and
-- there are no insert policies on these tables. No membership check is
-- possible here: this function creates the first membership. It runs only as
-- a trigger and is not executable by API roles.

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  display_name text := left(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 100);
  new_workspace_id uuid;
begin
  insert into public.profiles (id, full_name)
  values (new.id, display_name);

  insert into public.workspaces (name)
  values (coalesce(display_name || '''s workspace', 'My workspace'))
  returning id into new_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role)
  values (new_workspace_id, new.id, 'owner');

  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
