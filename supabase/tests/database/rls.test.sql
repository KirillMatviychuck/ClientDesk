-- RLS isolation tests. Run with: npm run test:db
--
-- Users:
--   A - owner of workspace A
--   B - owner of workspace B (an outsider for workspace A)
--   M - added to workspace A as member, later promoted to admin
begin;

create extension if not exists pgtap with schema extensions;

select plan(25);

-- ---------------------------------------------------------------------------
-- Setup (as postgres)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'a@test.local', 'authenticated', 'authenticated', '{"full_name":"Alice"}'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'b@test.local', 'authenticated', 'authenticated', '{}'),
  ('cccccccc-0000-0000-0000-000000000003', 'm@test.local', 'authenticated', 'authenticated', '{}');

-- Only the three test users: the local database may hold other accounts.
create temp table ws as
  select m.user_id as owner_id, m.workspace_id as id
  from public.workspace_members m
  where m.role = 'owner'
    and m.user_id in ('aaaaaaaa-0000-0000-0000-000000000001',
                      'bbbbbbbb-0000-0000-0000-000000000002',
                      'cccccccc-0000-0000-0000-000000000003');
grant select on ws to authenticated;

insert into public.workspace_members (workspace_id, user_id, role)
select id, 'cccccccc-0000-0000-0000-000000000003', 'member'
from ws where owner_id = 'aaaaaaaa-0000-0000-0000-000000000001';

-- Trigger on auth.users
select is(
  (select full_name from public.profiles where id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'Alice', 'sign-up creates a profile with the full name');
select is(
  (select w.name from public.workspaces w join ws on ws.id = w.id
   where ws.owner_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  'Alice''s workspace', 'sign-up creates a named workspace');
select is(
  (select count(*)::int from ws), 3, 'every new user becomes owner of their own workspace');

-- ---------------------------------------------------------------------------
-- As A (owner of workspace A)
-- ---------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}', true);

select is((select count(*)::int from public.workspaces), 1, 'A sees only their own workspace');

select lives_ok($$
  insert into public.clients (id, workspace_id, name) values
    ('11111111-0000-0000-0000-000000000001',
     (select id from ws where owner_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'Acme'),
    ('11111111-0000-0000-0000-000000000002',
     (select id from ws where owner_id = 'aaaaaaaa-0000-0000-0000-000000000001'), 'Globex')
$$, 'A can insert clients into workspace A');

select lives_ok($$
  insert into public.deals (workspace_id, client_id, name, amount_cents)
  values ((select id from ws where owner_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
          '11111111-0000-0000-0000-000000000001', 'Website redesign', 150000)
$$, 'A can insert a deal for their client');

select throws_ok($$
  insert into public.clients (workspace_id, name)
  values ((select id from ws where owner_id = 'bbbbbbbb-0000-0000-0000-000000000002'), 'Intruder')
$$, '42501', null, 'A cannot insert a client into workspace B');

select throws_ok($$
  insert into public.workspace_members (workspace_id, user_id, role)
  values ((select id from ws where owner_id = 'bbbbbbbb-0000-0000-0000-000000000002'),
          'aaaaaaaa-0000-0000-0000-000000000001', 'owner')
$$, '42501', null, 'A cannot add themselves to another workspace');

select throws_ok($$
  insert into public.activity_events (workspace_id, source, type, client_id)
  values ((select id from ws where owner_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
          'system', 'client_created', '11111111-0000-0000-0000-000000000001')
$$, '42501', null, 'A cannot forge a system activity event');

select lives_ok($$
  insert into public.activity_events (workspace_id, type, client_id, body)
  values ((select id from ws where owner_id = 'aaaaaaaa-0000-0000-0000-000000000001'),
          'call', '11111111-0000-0000-0000-000000000001', 'Kick-off call')
$$, 'A can add a manual activity entry');

-- ---------------------------------------------------------------------------
-- As B (outsider)
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"bbbbbbbb-0000-0000-0000-000000000002","role":"authenticated"}', true);

select is((select count(*)::int from public.clients), 0, 'B cannot read clients of workspace A');
select is((select count(*)::int from public.activity_events), 0, 'B cannot read activity of workspace A');
select is((select count(*)::int from public.profiles), 1, 'B sees only their own profile');

select results_eq($$
  with u as (update public.clients set name = 'Hacked'
             where id = '11111111-0000-0000-0000-000000000001' returning 1)
  select count(*)::int from u
$$, $$ values (0) $$, 'B cannot update a client of workspace A');

select results_eq($$
  with d as (delete from public.clients
             where id = '11111111-0000-0000-0000-000000000001' returning 1)
  select count(*)::int from d
$$, $$ values (0) $$, 'B cannot delete a client of workspace A');

select throws_ok($$
  insert into public.deals (workspace_id, client_id, name)
  values ((select id from ws where owner_id = 'bbbbbbbb-0000-0000-0000-000000000002'),
          '11111111-0000-0000-0000-000000000001', 'Stolen link')
$$, '23503', null, 'B cannot link a deal to a client of workspace A');

-- ---------------------------------------------------------------------------
-- As M (member of workspace A)
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"cccccccc-0000-0000-0000-000000000003","role":"authenticated"}', true);

select is((select count(*)::int from public.clients), 2, 'member reads clients of their workspace');

select results_eq($$
  with u as (update public.clients set notes = 'Updated by member'
             where id = '11111111-0000-0000-0000-000000000001' returning 1)
  select count(*)::int from u
$$, $$ values (1) $$, 'member can update a client');

select results_eq($$
  with d as (delete from public.clients
             where id = '11111111-0000-0000-0000-000000000001' returning 1)
  select count(*)::int from d
$$, $$ values (0) $$, 'member cannot delete a client');

select results_eq($$
  with u as (update public.workspace_members set role = 'owner'
             where user_id = 'cccccccc-0000-0000-0000-000000000003' returning 1)
  select count(*)::int from u
$$, $$ values (0) $$, 'member cannot change their own role');

-- Promote M to admin (as postgres), then act as M again.
reset role;
update public.workspace_members set role = 'admin'
where user_id = 'cccccccc-0000-0000-0000-000000000003';
set local role authenticated;

select results_eq($$
  with d as (delete from public.clients
             where id = '11111111-0000-0000-0000-000000000002' returning 1)
  select count(*)::int from d
$$, $$ values (1) $$, 'admin can delete a client');

select results_eq($$
  with d as (delete from public.workspaces
             where id = (select id from ws where owner_id = 'aaaaaaaa-0000-0000-0000-000000000001')
             returning 1)
  select count(*)::int from d
$$, $$ values (0) $$, 'admin cannot delete the workspace');

-- ---------------------------------------------------------------------------
-- As A again: owner deletes
-- ---------------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"aaaaaaaa-0000-0000-0000-000000000001","role":"authenticated"}', true);

select results_eq($$
  with d as (delete from public.workspaces
             where id = (select id from ws where owner_id = 'aaaaaaaa-0000-0000-0000-000000000001')
             returning 1)
  select count(*)::int from d
$$, $$ values (1) $$, 'owner can delete the workspace (cascades clients and deals)');

-- ---------------------------------------------------------------------------
-- As anon (no session)
-- ---------------------------------------------------------------------------
reset role;
set local role anon;
select set_config('request.jwt.claims', '{"role":"anon"}', true);

select throws_ok('select count(*) from public.clients', '42501', null,
  'anon has no access to business tables');
select throws_ok('select count(*) from public.workspaces', '42501', null,
  'anon has no access to workspaces');

select * from finish();
rollback;
