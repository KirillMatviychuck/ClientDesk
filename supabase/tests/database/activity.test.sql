-- Automatic activity feed (ACT-1). Runs as the workspace owner through RLS.
begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

insert into auth.users (id, email, aud, role) values
  ('ffffffff-0000-0000-0000-000000000001', 'act@test.local', 'authenticated', 'authenticated');

create temp table ctx as
  select workspace_id as ws from public.workspace_members
  where user_id = 'ffffffff-0000-0000-0000-000000000001';
grant select on ctx to authenticated;

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"ffffffff-0000-0000-0000-000000000001","role":"authenticated"}', true);

-- Feed of one client, oldest first, as "type" strings.
create function pg_temp.feed(cid uuid) returns text[] language sql as $$
  select coalesce(array_agg(type::text order by occurred_at, created_at, type::text), '{}')
  from public.activity_events where client_id = cid and source = 'system'
$$;

insert into public.clients (id, workspace_id, name)
select '41111111-0000-0000-0000-000000000001', ws, 'Acme' from ctx;
select is(pg_temp.feed('41111111-0000-0000-0000-000000000001'), array['client_created'],
  'creating a client is logged');

update public.clients set name = 'Acme Ltd', notes = null
where id = '41111111-0000-0000-0000-000000000001';
select is((select changes from public.activity_events where type = 'client_updated'),
  '{"name": {"old": "Acme", "new": "Acme Ltd"}}'::jsonb,
  'a client update stores only the changed fields as old -> new');

update public.clients set updated_at = now() where id = '41111111-0000-0000-0000-000000000001';
select is((select count(*)::int from public.activity_events where type = 'client_updated'), 1,
  'an update without real changes is not logged');

update public.clients set archived_at = now() where id = '41111111-0000-0000-0000-000000000001';
update public.clients set archived_at = null where id = '41111111-0000-0000-0000-000000000001';
select ok((select count(*) = 2 from public.activity_events
           where type in ('client_archived', 'client_restored')),
  'archiving and restoring a client are logged');

-- deals -------------------------------------------------------------------------
insert into public.deals (id, workspace_id, client_id, name, amount_cents)
select '42222222-0000-0000-0000-000000000001', ws, '41111111-0000-0000-0000-000000000001', 'Site', 1000
from ctx;
update public.deals set position = 5 where id = '42222222-0000-0000-0000-000000000001';
select is((select count(*)::int from public.activity_events
           where deal_id = '42222222-0000-0000-0000-000000000001'), 1,
  'deal creation is logged; reordering on the board is not');

update public.deals set stage = 'won' where id = '42222222-0000-0000-0000-000000000001';
select is((select changes -> 'stage' from public.activity_events where type = 'deal_stage_changed'),
  '{"old": "lead", "new": "won"}'::jsonb, 'a stage change is logged with old and new stage');

update public.deals set stage = 'negotiation', amount_cents = 2000
where id = '42222222-0000-0000-0000-000000000001';
select ok((select count(*) = 2 from public.activity_events
           where type in ('deal_reopened', 'deal_updated')
             and deal_id = '42222222-0000-0000-0000-000000000001'),
  'reopening logs deal_reopened, and the field change logs deal_updated');

-- tasks -------------------------------------------------------------------------
insert into public.tasks (id, workspace_id, client_id, deal_id, title)
select '43333333-0000-0000-0000-000000000001', ws, '41111111-0000-0000-0000-000000000001',
       '42222222-0000-0000-0000-000000000001', 'Call back'
from ctx;
update public.tasks set status = 'done' where id = '43333333-0000-0000-0000-000000000001';
select is((select array_agg(type::text order by type::text) from public.activity_events
           where task_id = '43333333-0000-0000-0000-000000000001'),
  array['task_completed', 'task_created'], 'creating and completing a task are logged');

select ok((select bool_and(deal_id = '42222222-0000-0000-0000-000000000001')
           from public.activity_events where task_id is not null),
  'task events carry the linked deal (shown in the deal feed)');

-- invoices and payments ---------------------------------------------------------
insert into public.invoices (id, workspace_id, client_id, issue_date, due_date)
select '44444444-0000-0000-0000-000000000001', ws, '41111111-0000-0000-0000-000000000001',
       '2026-06-01', '2026-06-15'
from ctx;
insert into public.invoice_items (workspace_id, invoice_id, description, quantity, unit_price_cents)
select ws, '44444444-0000-0000-0000-000000000001', 'Work', 1, 10000 from ctx;
update public.invoices set status = 'sent' where id = '44444444-0000-0000-0000-000000000001';
insert into public.payments (id, workspace_id, invoice_id, amount_cents, paid_on)
select '45555555-0000-0000-0000-000000000001', ws, '44444444-0000-0000-0000-000000000001', 10000,
       '2026-06-05'
from ctx;

select results_eq($$
  select changes -> 'status' ->> 'new' from public.activity_events
  where type = 'invoice_status_changed' order by created_at, changes -> 'status' ->> 'new' desc
$$, $$ values ('sent'), ('paid') $$,
  'manual and payment-driven status changes are both logged');

select ok((select client_id = '41111111-0000-0000-0000-000000000001'
                  and changes ->> 'amount_cents' = '10000'
           from public.activity_events where type = 'payment_recorded'),
  'a payment is logged in the client feed with its amount');

delete from public.payments where id = '45555555-0000-0000-0000-000000000001';
select is((select count(*)::int from public.activity_events where type = 'payment_deleted'), 1,
  'deleting a payment is logged');

-- protection ----------------------------------------------------------------------
select results_eq($$
  with d as (delete from public.activity_events where source = 'system' returning 1)
  select count(*)::int from d
$$, $$ values (0) $$, 'system events cannot be deleted');

insert into public.clients (id, workspace_id, name)
select '41111111-0000-0000-0000-000000000002', ws, 'Short-lived' from ctx;
insert into public.activity_events (workspace_id, type, client_id, body)
select ws, 'note', '41111111-0000-0000-0000-000000000002', 'Met at a conference' from ctx;
select results_eq($$
  with d as (delete from public.clients where id = '41111111-0000-0000-0000-000000000002'
             returning 1)
  select count(*)::int from d
$$, $$ values (1) $$, 'a client with manual notes can be deleted (its feed goes with it)');

select results_eq($$
  with d as (delete from public.workspaces returning 1)
  select count(*)::int from d
$$, $$ values (1) $$, 'a workspace with a full history can still be deleted');

select * from finish();
rollback;
