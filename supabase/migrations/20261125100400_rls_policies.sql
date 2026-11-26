-- Row Level Security policies.
--
-- RLS is already enabled on every table (in the migration that created it).
-- All policies target the `authenticated` role. `anon` has no policies and no
-- table privileges, so without a session nothing is readable. Anonymous demo
-- users are real auth users with the `authenticated` role.
--
-- Rule for business tables:
--   select / insert / update -> any member of the row's workspace
--   delete                   -> workspace owner or admin

-- ---------------------------------------------------------------------------
-- Privileges (defense in depth on top of RLS)
-- ---------------------------------------------------------------------------
-- anon gets nothing. TRUNCATE bypasses RLS, so authenticated never gets it.
revoke all on all tables in schema public from anon;
revoke truncate, references, trigger on all tables in schema public from authenticated;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke truncate, references, trigger on tables from authenticated;

-- ---------------------------------------------------------------------------
-- profiles: only your own row. Rows are created by handle_new_user and
-- removed by cascade from auth.users, so no insert/delete policies.
-- ---------------------------------------------------------------------------
create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- workspaces: members read and edit settings; only the owner deletes.
-- Created only by handle_new_user, so no insert policy.
-- ---------------------------------------------------------------------------
create policy "workspaces: members read"
  on public.workspaces for select to authenticated
  using (public.is_workspace_member(id));

create policy "workspaces: members update"
  on public.workspaces for update to authenticated
  using (public.is_workspace_member(id))
  with check (public.is_workspace_member(id));

create policy "workspaces: owner deletes"
  on public.workspaces for delete to authenticated
  using (public.has_workspace_role(id, array['owner']));

-- ---------------------------------------------------------------------------
-- workspace_members: members see who is in their workspace.
-- No insert/update/delete policies: otherwise a member could add themselves
-- as a second owner or raise their own role. Membership changes go through
-- handle_new_user now, and through security definer functions if teams
-- are ever added.
-- ---------------------------------------------------------------------------
create policy "workspace_members: members read"
  on public.workspace_members for select to authenticated
  using (public.is_workspace_member(workspace_id));

-- ---------------------------------------------------------------------------
-- Business tables with the standard rule.
-- ---------------------------------------------------------------------------
-- clients
create policy "clients: members read"
  on public.clients for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "clients: members insert"
  on public.clients for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy "clients: members update"
  on public.clients for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "clients: owner or admin deletes"
  on public.clients for delete to authenticated
  using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

-- client_contacts
create policy "client_contacts: members read"
  on public.client_contacts for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "client_contacts: members insert"
  on public.client_contacts for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy "client_contacts: members update"
  on public.client_contacts for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "client_contacts: owner or admin deletes"
  on public.client_contacts for delete to authenticated
  using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

-- deals
create policy "deals: members read"
  on public.deals for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "deals: members insert"
  on public.deals for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy "deals: members update"
  on public.deals for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "deals: owner or admin deletes"
  on public.deals for delete to authenticated
  using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

-- tasks
create policy "tasks: members read"
  on public.tasks for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "tasks: members insert"
  on public.tasks for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy "tasks: members update"
  on public.tasks for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "tasks: owner or admin deletes"
  on public.tasks for delete to authenticated
  using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

-- invoices
create policy "invoices: members read"
  on public.invoices for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "invoices: members insert"
  on public.invoices for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy "invoices: members update"
  on public.invoices for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "invoices: owner or admin deletes"
  on public.invoices for delete to authenticated
  using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

-- invoice_items
create policy "invoice_items: members read"
  on public.invoice_items for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "invoice_items: members insert"
  on public.invoice_items for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy "invoice_items: members update"
  on public.invoice_items for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "invoice_items: owner or admin deletes"
  on public.invoice_items for delete to authenticated
  using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

-- payments
create policy "payments: members read"
  on public.payments for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "payments: members insert"
  on public.payments for insert to authenticated
  with check (public.is_workspace_member(workspace_id));

create policy "payments: members update"
  on public.payments for update to authenticated
  using (public.is_workspace_member(workspace_id))
  with check (public.is_workspace_member(workspace_id));

create policy "payments: owner or admin deletes"
  on public.payments for delete to authenticated
  using (public.has_workspace_role(workspace_id, array['owner', 'admin']));

-- ---------------------------------------------------------------------------
-- activity_events: standard rule, but system events (written by triggers)
-- cannot be created, edited or deleted from the client (ACT-1, ACT-2).
-- ---------------------------------------------------------------------------
create policy "activity_events: members read"
  on public.activity_events for select to authenticated
  using (public.is_workspace_member(workspace_id));

create policy "activity_events: members insert manual"
  on public.activity_events for insert to authenticated
  with check (
    public.is_workspace_member(workspace_id)
    and source = 'manual'
    and created_by = (select auth.uid())
  );

create policy "activity_events: members update manual"
  on public.activity_events for update to authenticated
  using (public.is_workspace_member(workspace_id) and source = 'manual')
  with check (public.is_workspace_member(workspace_id) and source = 'manual');

create policy "activity_events: owner or admin deletes manual"
  on public.activity_events for delete to authenticated
  using (
    public.has_workspace_role(workspace_id, array['owner', 'admin'])
    and source = 'manual'
  );
