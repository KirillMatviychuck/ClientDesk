-- Invoice logic: numbering, totals, VAT, status and payments (INV-1 to INV-3).
-- Runs as the workspace owner through RLS, like the app does.
begin;

create extension if not exists pgtap with schema extensions;

select plan(28);

insert into auth.users (id, email, aud, role) values
  ('eeeeeeee-0000-0000-0000-000000000001', 'inv@test.local', 'authenticated', 'authenticated');

create temp table ctx as
  select workspace_id as ws from public.workspace_members
  where user_id = 'eeeeeeee-0000-0000-0000-000000000001';
grant select on ctx to authenticated;

set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"eeeeeeee-0000-0000-0000-000000000001","role":"authenticated"}', true);

update public.workspaces set currency = 'USD';

insert into public.clients (id, workspace_id, name)
select '31111111-0000-0000-0000-000000000001', ws, 'Client' from ctx;

-- Numbering and insert defaults ------------------------------------------------
insert into public.invoices (id, workspace_id, client_id, issue_date, due_date,
                             status, total_cents, vat_rate_bp)
select '32222222-0000-0000-0000-000000000001', ws, '31111111-0000-0000-0000-000000000001',
       '2026-03-01', '2026-03-15', 'paid', 99999, 2000
from ctx;

insert into public.invoices (id, workspace_id, client_id, issue_date, due_date)
select '32222222-0000-0000-0000-000000000002', ws, '31111111-0000-0000-0000-000000000001',
       '2026-04-01', '2026-04-15'
from ctx;

insert into public.invoices (id, workspace_id, client_id, issue_date, due_date)
select '32222222-0000-0000-0000-000000000003', ws, '31111111-0000-0000-0000-000000000001',
       '2027-01-05', '2027-01-19'
from ctx;

select results_eq($$
  select number from public.invoices order by issue_date
$$, $$ values ('INV-2026-0001'), ('INV-2026-0002'), ('INV-2027-0001') $$,
  'numbers are sequential per year and restart in a new year');

select is((select row(status, total_cents, vat_rate_bp)::text from public.invoices
           where id = '32222222-0000-0000-0000-000000000001'),
  row('draft'::public.invoice_status, 0::bigint, null::smallint)::text,
  'status, totals and VAT sent by the client are ignored on insert');

select is((select currency from public.invoices where id = '32222222-0000-0000-0000-000000000001'),
  'USD'::public.currency_code, 'currency is copied from the workspace');

-- Items and totals -------------------------------------------------------------
insert into public.invoice_items (workspace_id, invoice_id, description, quantity, unit_price_cents,
                                  line_total_cents)
select ws, '32222222-0000-0000-0000-000000000001', 'Design', 1.5, 3333, 1 from ctx;
insert into public.invoice_items (workspace_id, invoice_id, description, quantity, unit_price_cents)
select ws, '32222222-0000-0000-0000-000000000001', 'Development', 2, 5000 from ctx;

select is((select line_total_cents from public.invoice_items where description = 'Design'),
  5000::bigint, 'line total is computed and rounded half-up (1.5 x 33.33 = 50.00)');

select is((select row(subtotal_cents, vat_cents, total_cents)::text from public.invoices
           where id = '32222222-0000-0000-0000-000000000001'),
  row(15000::bigint, 0::bigint, 15000::bigint)::text,
  'invoice totals follow the line items');

update public.invoices set total_cents = 1, paid_cents = 1
where id = '32222222-0000-0000-0000-000000000001';
select is((select row(total_cents, paid_cents)::text from public.invoices
           where id = '32222222-0000-0000-0000-000000000001'),
  row(15000::bigint, 0::bigint)::text, 'derived totals cannot be written by the client');

-- VAT payer --------------------------------------------------------------------
update public.workspaces set is_vat_payer = true;
insert into public.invoices (id, workspace_id, client_id, issue_date, due_date)
select '32222222-0000-0000-0000-000000000004', ws, '31111111-0000-0000-0000-000000000001',
       '2026-05-01', '2026-05-15'
from ctx;
insert into public.invoice_items (workspace_id, invoice_id, description, quantity, unit_price_cents)
select ws, '32222222-0000-0000-0000-000000000004', 'Audit', 1, 3333 from ctx;

select is((select row(vat_rate_bp, vat_cents, total_cents)::text from public.invoices
           where id = '32222222-0000-0000-0000-000000000004'),
  row(2000::smallint, 667::bigint, 4000::bigint)::text,
  'VAT payers default to 20 %; VAT is rounded half-up (666.6 -> 667)');

update public.invoices set vat_rate_bp = 700 where id = '32222222-0000-0000-0000-000000000004';
select is((select vat_cents from public.invoices where id = '32222222-0000-0000-0000-000000000004'),
  233::bigint, 'changing the VAT rate on a draft recomputes VAT');

-- Status and payments ----------------------------------------------------------
select throws_ok($$
  insert into public.payments (workspace_id, invoice_id, amount_cents, paid_on)
  select ws, '32222222-0000-0000-0000-000000000001', 1000, '2026-03-05' from ctx
$$, '23514', null, 'no payments on a draft invoice');

select throws_ok($$
  update public.invoices set status = 'sent' where id = '32222222-0000-0000-0000-000000000002'
$$, '23514', null, 'an invoice without amounts cannot be sent');

update public.invoices set status = 'sent' where id = '32222222-0000-0000-0000-000000000001';
select ok((select status = 'sent' and sent_at is not null from public.invoices
           where id = '32222222-0000-0000-0000-000000000001'), 'Mark as sent sets status and sent_at');

select throws_ok($$
  update public.invoices set status = 'paid' where id = '32222222-0000-0000-0000-000000000001'
$$, '23514', null, 'Paid cannot be set by hand');

select throws_ok($$
  update public.invoices set status = 'draft' where id = '32222222-0000-0000-0000-000000000001'
$$, '23514', null, 'a sent invoice cannot go back to Draft');

select throws_ok($$
  update public.invoices set due_date = '2026-12-31' where id = '32222222-0000-0000-0000-000000000001'
$$, '23514', null, 'a sent invoice cannot be edited');

select throws_ok($$
  insert into public.invoice_items (workspace_id, invoice_id, description, quantity, unit_price_cents)
  select ws, '32222222-0000-0000-0000-000000000001', 'Extra', 1, 100 from ctx
$$, '23514', null, 'line items cannot be added to a sent invoice');

insert into public.payments (id, workspace_id, invoice_id, amount_cents, paid_on)
select '33333333-0000-0000-0000-000000000001', ws, '32222222-0000-0000-0000-000000000001', 5000,
       '2026-03-10'
from ctx;
select is((select row(status, paid_cents)::text from public.invoices
           where id = '32222222-0000-0000-0000-000000000001'),
  row('partially_paid'::public.invoice_status, 5000::bigint)::text,
  'a part payment makes the invoice Partially paid');

select throws_ok($$
  insert into public.payments (workspace_id, invoice_id, amount_cents, paid_on)
  select ws, '32222222-0000-0000-0000-000000000001', 10001, '2026-03-11' from ctx
$$, '23514', null, 'payments cannot exceed the invoice total');

select throws_ok($$
  update public.payments set amount_cents = 15001 where id = '33333333-0000-0000-0000-000000000001'
$$, '23514', null, 'editing a payment cannot exceed the invoice total');

insert into public.payments (workspace_id, invoice_id, amount_cents, paid_on)
select ws, '32222222-0000-0000-0000-000000000001', 10000, '2026-03-12' from ctx;
select is((select status from public.invoices where id = '32222222-0000-0000-0000-000000000001'),
  'paid'::public.invoice_status, 'paying the balance makes the invoice Paid');

delete from public.payments where id = '33333333-0000-0000-0000-000000000001';
select is((select row(status, paid_cents)::text from public.invoices
           where id = '32222222-0000-0000-0000-000000000001'),
  row('partially_paid'::public.invoice_status, 10000::bigint)::text,
  'deleting a payment recalculates the status');

-- Delete and void --------------------------------------------------------------
select results_eq($$
  with d as (delete from public.invoices where id = '32222222-0000-0000-0000-000000000001'
             returning 1)
  select count(*)::int from d
$$, $$ values (0) $$, 'a sent invoice cannot be deleted');

select results_eq($$
  with d as (delete from public.invoice_items
             where invoice_id = '32222222-0000-0000-0000-000000000001' returning 1)
  select count(*)::int from d
$$, $$ values (0) $$, 'line items of a sent invoice cannot be deleted');

select results_eq($$
  with d as (delete from public.invoices where id = '32222222-0000-0000-0000-000000000004'
             returning 1)
  select count(*)::int from d
$$, $$ values (1) $$, 'a draft invoice can be deleted (with its items)');

update public.invoices set status = 'void' where id = '32222222-0000-0000-0000-000000000001';
select ok((select status = 'void' and voided_at is not null from public.invoices
           where id = '32222222-0000-0000-0000-000000000001'), 'a sent invoice can be voided');

select throws_ok($$
  insert into public.payments (workspace_id, invoice_id, amount_cents, paid_on)
  select ws, '32222222-0000-0000-0000-000000000001', 100, '2026-03-20' from ctx
$$, '23514', null, 'no payments on a void invoice');

select throws_ok($$
  update public.invoices set status = 'sent' where id = '32222222-0000-0000-0000-000000000001'
$$, '23514', null, 'a void invoice stays void');

select throws_ok($$
  update public.invoices set number_seq = 7, workspace_id = gen_random_uuid()
  where id = '32222222-0000-0000-0000-000000000002'
$$, '23514', null, 'an invoice cannot move to another workspace');

-- Workspace delete cascades through invoices, items and payments.
select results_eq($$
  with d as (delete from public.workspaces returning 1)
  select count(*)::int from d
$$, $$ values (1) $$, 'the owner can delete a workspace that has invoices and payments');

select * from finish();
rollback;
