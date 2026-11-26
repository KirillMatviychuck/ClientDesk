-- Access helpers used by RLS policies.
--
-- Why security definer: policies need to read workspace_members, but that table
-- has its own RLS. Reading it directly from a policy would recurse. These
-- functions run as their owner, read only the caller's own membership
-- (auth.uid()), and return a boolean, so they leak nothing else.
--
-- search_path is empty and every name is schema-qualified, so a caller cannot
-- shadow public.workspace_members with an object in another schema.

create function public.is_workspace_member(ws uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = ws
      and m.user_id = (select auth.uid())
  );
$$;

create function public.has_workspace_role(ws uuid, roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = ws
      and m.user_id = (select auth.uid())
      and m.role::text = any (roles)
  );
$$;

revoke execute on function public.is_workspace_member(uuid) from public, anon;
revoke execute on function public.has_workspace_role(uuid, text[]) from public, anon;
grant execute on function public.is_workspace_member(uuid) to authenticated;
grant execute on function public.has_workspace_role(uuid, text[]) to authenticated;
