-- Lifecycle timestamps: deals.closed_at and tasks.completed_at.
begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

insert into auth.users (id, email, aud, role) values
  ('dddddddd-0000-0000-0000-000000000001', 'life@test.local', 'authenticated', 'authenticated');

create temp table ctx as
  select workspace_id as ws from public.workspace_members
  where user_id = 'dddddddd-0000-0000-0000-000000000001';

insert into public.clients (id, workspace_id, name)
select '21111111-0000-0000-0000-000000000001', ws, 'Client' from ctx;

insert into public.deals (id, workspace_id, client_id, name)
select '22222222-0000-0000-0000-000000000001', ws, '21111111-0000-0000-0000-000000000001', 'Deal'
from ctx;

-- deals ---------------------------------------------------------------------
select is((select closed_at from public.deals where id = '22222222-0000-0000-0000-000000000001'),
  null, 'an open deal has no closed_at');

update public.deals set stage = 'won' where id = '22222222-0000-0000-0000-000000000001';
select isnt((select closed_at from public.deals where id = '22222222-0000-0000-0000-000000000001'),
  null, 'moving to Won sets closed_at without the client sending it');

update public.deals set closed_at = '2000-01-01' where id = '22222222-0000-0000-0000-000000000001';
select isnt((select closed_at from public.deals where id = '22222222-0000-0000-0000-000000000001'),
  '2000-01-01'::timestamptz, 'closed_at cannot be rewritten while the stage stays the same');

update public.deals set stage = 'lost', lost_reason = 'price'
where id = '22222222-0000-0000-0000-000000000001';
update public.deals set stage = 'negotiation' where id = '22222222-0000-0000-0000-000000000001';
select is((select row(closed_at, lost_reason)::text from public.deals
           where id = '22222222-0000-0000-0000-000000000001'),
  row(null::timestamptz, null::public.deal_lost_reason)::text,
  'reopening clears closed_at and the lost reason');

select throws_ok($$
  update public.deals set stage = 'lost' where id = '22222222-0000-0000-0000-000000000001'
$$, '23514', null, 'Lost still requires a reason');

insert into public.deals (workspace_id, client_id, name, stage, closed_at)
select ws, '21111111-0000-0000-0000-000000000001', 'Old win', 'won', '2026-01-15' from ctx;
select is((select closed_at from public.deals where name = 'Old win'),
  '2026-01-15'::timestamptz, 'insert keeps a given closed_at (back-dated seed data)');

-- tasks ---------------------------------------------------------------------
insert into public.tasks (id, workspace_id, title)
select '23333333-0000-0000-0000-000000000001', ws, 'Task' from ctx;

update public.tasks set status = 'done' where id = '23333333-0000-0000-0000-000000000001';
select isnt((select completed_at from public.tasks where id = '23333333-0000-0000-0000-000000000001'),
  null, 'completing a task sets completed_at');

update public.tasks set completed_at = '2000-01-01' where id = '23333333-0000-0000-0000-000000000001';
select isnt((select completed_at from public.tasks where id = '23333333-0000-0000-0000-000000000001'),
  '2000-01-01'::timestamptz, 'completed_at cannot be rewritten while the task stays done');

update public.tasks set status = 'todo' where id = '23333333-0000-0000-0000-000000000001';
select is((select completed_at from public.tasks where id = '23333333-0000-0000-0000-000000000001'),
  null, 'reopening a task clears completed_at');

select lives_ok($$
  insert into public.tasks (workspace_id, title, status)
  select ws, 'Done at once', 'done' from ctx
$$, 'a task can be created as done without sending completed_at');

select * from finish();
rollback;
