-- Demo mode (AUTH-1): seed, reset and cleanup.
begin;

create extension if not exists pgtap with schema extensions;

select plan(16);

insert into auth.users (id, aud, role, is_anonymous, created_at) values
  ('de000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', true, now()),
  ('de000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', true,
   now() - interval '8 days');
insert into auth.users (id, email, aud, role, created_at) values
  ('de000000-0000-0000-0000-000000000003', 'real@test.local', 'authenticated', 'authenticated',
   now() - interval '30 days');

-- As the fresh anonymous user ------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"de000000-0000-0000-0000-000000000001","role":"authenticated","is_anonymous":true}', true);

select lives_ok('select public.seed_demo_data()', 'an anonymous user can seed their workspace');

select is((select count(*)::int from public.clients), 25, '25 clients');
select is((select count(*)::int from public.deals), 30, '30 deals');
select is((select count(distinct stage)::int from public.deals), 5, 'deals in every stage');
select is((select count(*)::int from public.tasks), 40, '40 tasks');
select ok((select count(*) filter (where due_date < current_date and status = 'todo') >= 5
              and count(*) filter (where due_date = current_date) >= 3
           from public.tasks), 'overdue and due-today tasks exist');
select is((select count(*)::int from public.invoices), 20, '20 invoices');
select is((select count(distinct status)::int from public.invoices), 5, 'invoices in every status');
select ok((select bool_and(paid_cents <= total_cents and total_cents > 0) from public.invoices),
  'invoice totals and payments are consistent');
select ok((select min(occurred_at) < now() - interval '300 days'
              and count(*) filter (where source = 'manual') > 0
           from public.activity_events), 'activity covers ~12 months, with manual entries');
select is((select currency from public.workspaces), 'USD'::public.currency_code,
  'the demo workspace uses USD');

select throws_ok('select public.seed_demo_data()', '23505', null,
  'seeding twice is refused');

update public.clients set name = 'Changed by visitor' where name = 'Northwind Studio';
select public.reset_demo_data();
select ok((select count(*) = 25 and count(*) filter (where name = 'Changed by visitor') = 0
           from public.clients), 'reset restores the original demo data');

-- As a real (email) user -----------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub":"de000000-0000-0000-0000-000000000003","role":"authenticated"}', true);
select throws_ok('select public.reset_demo_data()', '42501', null,
  'a real account cannot be reset with the demo RPC');

-- Cleanup (as the cron job runs it) ------------------------------------------
reset role;
select is(public.cleanup_demo_accounts(), 1, 'cleanup deletes only anonymous accounts older than 7 days');
select ok((select count(*) = 2 from auth.users
           where id in ('de000000-0000-0000-0000-000000000001', 'de000000-0000-0000-0000-000000000003')),
  'fresh demo accounts and real accounts are kept');

select * from finish();
rollback;
