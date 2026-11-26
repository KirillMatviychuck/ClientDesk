-- Invoice logic (INV-1 to INV-3): numbering, totals, status and payments.
--
-- The database owns every derived invoice value. The client writes only the
-- editable fields (client, deal, dates, VAT rate, note), line items, payments
-- and two status requests: draft -> sent ("Mark as sent") and -> void.
--
-- How totals stay correct: the invoice BEFORE UPDATE trigger recomputes
-- subtotal, VAT, total, paid amount and the payment status from the items and
-- payments tables on every update. Item and payment triggers only "touch" the
-- parent invoice (update updated_at), which runs that recomputation. A value
-- sent by the client for a derived column is always overwritten.
--
-- Rounding: half-up to whole cents (numeric round() rounds half away from
-- zero; all amounts are non-negative).

-- ---------------------------------------------------------------------------
-- Placeholder defaults: these columns are always set by the insert trigger.
-- The defaults only make them optional for the client (and generated types).
-- 0 fails the check constraints, so a row can never be stored without the
-- trigger having run.
-- ---------------------------------------------------------------------------
alter table public.invoices alter column number_year set default 0;
alter table public.invoices alter column number_seq set default 0;
alter table public.invoices alter column currency set default 'UAH';
alter table public.invoice_items alter column line_total_cents set default 0;

-- ---------------------------------------------------------------------------
-- Per-workspace, per-year counter. A counter row (instead of max() + 1) makes
-- concurrent inserts safe: the upsert locks the row until commit.
-- Not reachable from the API: RLS on, no policies, no grants.
-- ---------------------------------------------------------------------------
create table public.invoice_counters (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  year smallint not null check (year between 2000 and 2999),
  last_seq integer not null check (last_seq > 0),
  primary key (workspace_id, year)
);

alter table public.invoice_counters enable row level security;
revoke all on public.invoice_counters from anon, authenticated;

-- ---------------------------------------------------------------------------
-- invoices: BEFORE INSERT
-- security definer: the counter table is not accessible to API roles.
-- It checks membership itself; RLS checks the inserted row afterwards as well.
-- auth.uid() is null only for direct database access (migrations, seed).
-- ---------------------------------------------------------------------------
create function public.invoices_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ws public.workspaces%rowtype;
begin
  if (select auth.uid()) is not null and not public.is_workspace_member(new.workspace_id) then
    raise exception 'Not a member of this workspace' using errcode = '42501';
  end if;

  select * into ws from public.workspaces where id = new.workspace_id;
  if not found then
    raise exception 'Workspace not found' using errcode = '23503';
  end if;

  -- Numbering restarts each year; the year comes from the issue date.
  new.number_year := extract(year from new.issue_date)::smallint;
  insert into public.invoice_counters as c (workspace_id, year, last_seq)
  values (new.workspace_id, new.number_year, 1)
  on conflict (workspace_id, year) do update set last_seq = c.last_seq + 1
  returning c.last_seq into new.number_seq;

  -- Currency is a snapshot of the workspace currency (never converted).
  new.currency := ws.currency;

  -- Non VAT payers: "VAT not applicable". VAT payers default to 20 %.
  if ws.is_vat_payer then
    new.vat_rate_bp := coalesce(new.vat_rate_bp, 2000);
  else
    new.vat_rate_bp := null;
  end if;

  -- A new invoice starts in Draft with no items and no payments.
  new.status := 'draft';
  new.subtotal_cents := 0;
  new.vat_cents := 0;
  new.total_cents := 0;
  new.paid_cents := 0;
  new.sent_at := null;
  new.voided_at := null;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- invoices: BEFORE UPDATE
-- ---------------------------------------------------------------------------
create function public.invoices_before_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- Identity and snapshot columns never change.
  if new.workspace_id is distinct from old.workspace_id then
    raise exception 'An invoice cannot move to another workspace' using errcode = '23514';
  end if;
  new.number_year := old.number_year;
  new.number_seq := old.number_seq;
  new.currency := old.currency;

  -- Only Draft is editable. Clearing deal_id is allowed: it happens by
  -- cascade when the linked deal is deleted.
  if old.status <> 'draft' and (
    (new.client_id, new.issue_date, new.due_date, new.vat_rate_bp, new.note)
      is distinct from (old.client_id, old.issue_date, old.due_date, old.vat_rate_bp, old.note)
    or (new.deal_id is distinct from old.deal_id and new.deal_id is not null)
  ) then
    raise exception 'Only draft invoices can be edited' using errcode = '23514';
  end if;

  -- Totals, always from the source rows.
  select coalesce(sum(i.line_total_cents), 0)
    into new.subtotal_cents
    from public.invoice_items i
    where i.invoice_id = new.id;

  new.vat_cents := coalesce(round(new.subtotal_cents * new.vat_rate_bp / 10000.0)::bigint, 0);
  new.total_cents := new.subtotal_cents + new.vat_cents;

  select coalesce(sum(p.amount_cents), 0)
    into new.paid_cents
    from public.payments p
    where p.invoice_id = new.id;

  -- Status requests: draft -> sent, and any non-void status -> void.
  if new.status is distinct from old.status then
    if new.status = 'void' then
      new.voided_at := coalesce(new.voided_at, now());
    elsif old.status = 'draft' and new.status = 'sent' then
      if new.total_cents = 0 then
        raise exception 'An invoice without amounts cannot be sent' using errcode = '23514';
      end if;
      new.sent_at := coalesce(new.sent_at, now());
    else
      raise exception 'Invalid invoice status change: % -> %', old.status, new.status
        using errcode = '23514';
    end if;
  else
    new.sent_at := old.sent_at;
    new.voided_at := old.voided_at;
  end if;

  -- Payment status is derived for every sent invoice (INV-3).
  if new.status in ('sent', 'partially_paid', 'paid') then
    new.status := case
      when new.paid_cents = 0 then 'sent'
      when new.paid_cents < new.total_cents then 'partially_paid'
      else 'paid'
    end;
  end if;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- invoice_items: only on Draft invoices; line total computed here.
-- Deleting items of non-draft invoices is blocked by the delete policy below
-- (policies do not apply to cascades, so deleting a workspace still works).
-- ---------------------------------------------------------------------------
create function public.invoice_items_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  invoice_status public.invoice_status;
begin
  if tg_op = 'UPDATE' and new.invoice_id is distinct from old.invoice_id then
    raise exception 'A line item cannot move to another invoice' using errcode = '23514';
  end if;

  select i.status into invoice_status from public.invoices i where i.id = new.invoice_id;
  if invoice_status is distinct from 'draft' then
    raise exception 'Line items can only be changed on draft invoices' using errcode = '23514';
  end if;

  new.line_total_cents := round(new.quantity * new.unit_price_cents)::bigint;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- payments: only on sent invoices, never above the remaining balance.
-- The invoice row is locked, so two concurrent payments cannot both pass.
-- ---------------------------------------------------------------------------
create function public.payments_before_write()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  inv record;
  other_paid bigint;
begin
  if tg_op = 'UPDATE' and new.invoice_id is distinct from old.invoice_id then
    raise exception 'A payment cannot move to another invoice' using errcode = '23514';
  end if;

  select i.status, i.total_cents into inv
    from public.invoices i
    where i.id = new.invoice_id
    for update;

  if inv.status is null or inv.status not in ('sent', 'partially_paid', 'paid') then
    raise exception 'Payments can only be recorded on sent invoices' using errcode = '23514';
  end if;

  select coalesce(sum(p.amount_cents), 0) into other_paid
    from public.payments p
    where p.invoice_id = new.invoice_id
      and p.id is distinct from new.id;

  if other_paid + new.amount_cents > inv.total_cents then
    raise exception 'Payments cannot exceed the invoice total (remaining: % cents)',
      inv.total_cents - other_paid
      using errcode = '23514';
  end if;

  return new;
end;
$$;

-- After any item or payment change: recompute the parent invoice.
-- A delete that comes from a cascade (pg_trigger_depth() > 1: the invoice or
-- the workspace is being deleted) is skipped. Updating a parent that the same
-- command is about to delete would fail with "tuple already modified".
create function public.touch_parent_invoice()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return null;
  end if;

  update public.invoices
    set updated_at = now()
    where id = case when tg_op = 'DELETE' then old.invoice_id else new.invoice_id end;
  return null;
end;
$$;

revoke execute on function public.invoices_before_insert() from public, anon, authenticated;
revoke execute on function public.invoices_before_update() from public, anon, authenticated;
revoke execute on function public.invoice_items_before_write() from public, anon, authenticated;
revoke execute on function public.payments_before_write() from public, anon, authenticated;
revoke execute on function public.touch_parent_invoice() from public, anon, authenticated;

create trigger invoices_before_insert
  before insert on public.invoices
  for each row execute function public.invoices_before_insert();

create trigger invoices_before_update
  before update on public.invoices
  for each row execute function public.invoices_before_update();

create trigger invoice_items_before_write
  before insert or update on public.invoice_items
  for each row execute function public.invoice_items_before_write();

create trigger invoice_items_touch_invoice
  after insert or update or delete on public.invoice_items
  for each row execute function public.touch_parent_invoice();

create trigger payments_before_write
  before insert or update on public.payments
  for each row execute function public.payments_before_write();

create trigger payments_touch_invoice
  after insert or update or delete on public.payments
  for each row execute function public.touch_parent_invoice();

-- ---------------------------------------------------------------------------
-- Delete rules: only Draft invoices can be deleted (others are voided), and
-- only items of Draft invoices.
-- ---------------------------------------------------------------------------
drop policy "invoices: owner or admin deletes" on public.invoices;
create policy "invoices: owner or admin deletes drafts"
  on public.invoices for delete to authenticated
  using (
    public.has_workspace_role(workspace_id, array['owner', 'admin'])
    and status = 'draft'
  );

drop policy "invoice_items: owner or admin deletes" on public.invoice_items;
create policy "invoice_items: owner or admin deletes on drafts"
  on public.invoice_items for delete to authenticated
  using (
    public.has_workspace_role(workspace_id, array['owner', 'admin'])
    and exists (
      select 1 from public.invoices i
      where i.id = invoice_id and i.status = 'draft'
    )
  );
