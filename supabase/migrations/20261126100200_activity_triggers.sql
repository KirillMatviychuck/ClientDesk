-- Automatic activity feed (ACT-1): system events written by triggers.
--
-- Logged: client created / updated / archived / restored; deal created /
-- updated / stage changed / archived / reopened; task created / completed;
-- invoice status changed; payment recorded / deleted.
--
-- `changes` holds field diffs: {"field": {"old": ..., "new": ...}}.
-- Every event carries the client (and deal / task / invoice) it belongs to,
-- so a client's feed is one filter on client_id (ACT-1).
--
-- Why security definer: the insert policy on activity_events accepts only
-- manual entries, so the client can never forge a system event (D12). These
-- trigger functions run as their owner to write system rows. They run only as
-- triggers (execute is revoked from API roles) and log_activity() checks that
-- the caller is a member of the row's workspace.
--
-- Event time: now(), unless the transaction-local setting
-- `clientdesk.activity_at` is set. Only server-side code (the demo seed) sets
-- it, to back-date history. API clients cannot set custom settings.

-- Diff of the given keys between two row images.
create function public.jsonb_changes(old_row jsonb, new_row jsonb, keys text[])
returns jsonb
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    jsonb_object_agg(k, jsonb_build_object('old', old_row -> k, 'new', new_row -> k)),
    '{}'::jsonb
  )
  from unnest(keys) as k
  where (old_row -> k) is distinct from (new_row -> k);
$$;

create function public.log_activity(
  ws uuid,
  event_type public.activity_type,
  p_client_id uuid,
  p_deal_id uuid default null,
  p_task_id uuid default null,
  p_invoice_id uuid default null,
  p_changes jsonb default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_workspace_member(ws) then
    raise exception 'Not a member of this workspace' using errcode = '42501';
  end if;

  insert into public.activity_events
    (workspace_id, source, type, occurred_at, changes, client_id, deal_id, task_id, invoice_id)
  values (
    ws, 'system', event_type,
    coalesce(nullif(current_setting('clientdesk.activity_at', true), '')::timestamptz, now()),
    nullif(p_changes, '{}'::jsonb),
    p_client_id, p_deal_id, p_task_id, p_invoice_id
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create function public.clients_log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  diff jsonb;
begin
  if tg_op = 'INSERT' then
    perform public.log_activity(new.workspace_id, 'client_created', new.id);
    return null;
  end if;

  if old.archived_at is null and new.archived_at is not null then
    perform public.log_activity(new.workspace_id, 'client_archived', new.id);
  elsif old.archived_at is not null and new.archived_at is null then
    perform public.log_activity(new.workspace_id, 'client_restored', new.id);
  end if;

  diff := public.jsonb_changes(to_jsonb(old), to_jsonb(new), array[
    'type', 'name', 'email', 'phone', 'website', 'country', 'source',
    'tax_number', 'address', 'notes', 'tags']);
  if diff <> '{}'::jsonb then
    perform public.log_activity(new.workspace_id, 'client_updated', new.id, p_changes => diff);
  end if;

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- deals (position changes from Kanban reordering are not logged)
-- ---------------------------------------------------------------------------
create function public.deals_log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  diff jsonb;
begin
  if tg_op = 'INSERT' then
    perform public.log_activity(new.workspace_id, 'deal_created', new.client_id, new.id);
    return null;
  end if;

  if new.stage is distinct from old.stage then
    diff := public.jsonb_changes(to_jsonb(old), to_jsonb(new),
      array['stage', 'lost_reason', 'lost_comment']);
    perform public.log_activity(
      new.workspace_id,
      case when old.stage in ('won', 'lost') and new.stage not in ('won', 'lost')
           then 'deal_reopened'::public.activity_type
           else 'deal_stage_changed'::public.activity_type end,
      new.client_id, new.id, p_changes => diff);
  end if;

  if old.archived_at is null and new.archived_at is not null then
    perform public.log_activity(new.workspace_id, 'deal_archived', new.client_id, new.id);
  end if;

  -- Restoring from the archive has no own event type; it is an update.
  diff := public.jsonb_changes(to_jsonb(old), to_jsonb(new), array[
    'name', 'client_id', 'amount_cents', 'expected_close_date', 'source', 'description']);
  if old.archived_at is not null and new.archived_at is null then
    diff := diff || jsonb_build_object('archived', jsonb_build_object('old', true, 'new', false));
  end if;
  if diff <> '{}'::jsonb then
    perform public.log_activity(new.workspace_id, 'deal_updated', new.client_id, new.id,
      p_changes => diff);
  end if;

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create function public.tasks_log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_activity(new.workspace_id, 'task_created', new.client_id, new.deal_id, new.id);
    if new.status = 'done' then
      perform public.log_activity(new.workspace_id, 'task_completed', new.client_id, new.deal_id,
        new.id);
    end if;
  elsif old.status <> 'done' and new.status = 'done' then
    perform public.log_activity(new.workspace_id, 'task_completed', new.client_id, new.deal_id,
      new.id);
  end if;

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- invoices: status changes, including those derived from payments
-- ---------------------------------------------------------------------------
create function public.invoices_log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    perform public.log_activity(new.workspace_id, 'invoice_status_changed', new.client_id,
      new.deal_id, null, new.id,
      public.jsonb_changes(to_jsonb(old), to_jsonb(new), array['status']));
  end if;

  return null;
end;
$$;

-- ---------------------------------------------------------------------------
-- payments. Cascaded deletes (the invoice or workspace is being deleted) are
-- not logged: cascades run after the parent row is gone, so a missing invoice
-- means the event would point at nothing.
-- ---------------------------------------------------------------------------
create function public.payments_log_activity()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  pay public.payments%rowtype;
  inv record;
begin
  pay := case when tg_op = 'DELETE' then old else new end;

  select i.client_id, i.deal_id into inv from public.invoices i where i.id = pay.invoice_id;
  if not found then
    return null;
  end if;

  perform public.log_activity(
    pay.workspace_id,
    case when tg_op = 'DELETE' then 'payment_deleted'::public.activity_type
         else 'payment_recorded'::public.activity_type end,
    inv.client_id, inv.deal_id, null, pay.invoice_id,
    jsonb_build_object(
      'amount_cents', pay.amount_cents,
      'paid_on', pay.paid_on,
      'method', pay.method));

  return null;
end;
$$;

revoke execute on function public.jsonb_changes(jsonb, jsonb, text[]) from public, anon, authenticated;
revoke execute on function public.log_activity(uuid, public.activity_type, uuid, uuid, uuid, uuid, jsonb)
  from public, anon, authenticated;
revoke execute on function public.clients_log_activity() from public, anon, authenticated;
revoke execute on function public.deals_log_activity() from public, anon, authenticated;
revoke execute on function public.tasks_log_activity() from public, anon, authenticated;
revoke execute on function public.invoices_log_activity() from public, anon, authenticated;
revoke execute on function public.payments_log_activity() from public, anon, authenticated;

create trigger clients_log_activity
  after insert or update on public.clients
  for each row execute function public.clients_log_activity();

create trigger deals_log_activity
  after insert or update on public.deals
  for each row execute function public.deals_log_activity();

create trigger tasks_log_activity
  after insert or update on public.tasks
  for each row execute function public.tasks_log_activity();

create trigger invoices_log_activity
  after update on public.invoices
  for each row execute function public.invoices_log_activity();

create trigger payments_log_activity
  after insert or delete on public.payments
  for each row execute function public.payments_log_activity();
