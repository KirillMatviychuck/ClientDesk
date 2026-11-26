-- Demo mode (AUTH-1): seed, reset and cleanup of anonymous demo accounts.
--
-- Flow: the login page calls supabase.auth.signInAnonymously(). The sign-up
-- trigger creates the workspace. The app then calls rpc('seed_demo_data').
-- The banner's "Reset demo data" calls rpc('reset_demo_data').
-- A daily pg_cron job deletes anonymous accounts older than 7 days; the
-- user-delete trigger removes their workspace and data.
--
-- Data: ~12 months of history relative to "today" in the user's timezone:
-- 25 clients, 30 deals in every stage, 40 tasks (overdue, today, upcoming,
-- done), 20 invoices in every status with payments, and an activity feed.
-- Generation is deterministic (no random()), so every demo looks the same.
--
-- Why security definer: the RPCs must check `is_anonymous` in auth.users and
-- write back-dated system activity, which API roles cannot do. Both RPCs act
-- only on the caller's own (owned) workspace and refuse non-anonymous users,
-- so a real account can never be wiped by them.

-- ---------------------------------------------------------------------------
-- Internal: fill a workspace with demo data. Not callable from the API.
-- ---------------------------------------------------------------------------
create function public.generate_demo_data(ws uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_id uuid;
  tz text;
  today date;
  ts timestamptz;
  ts2 timestamptz;
  i int;
  j int;
  k int;
  n int;
  cnt int;

  client_ids uuid[] := '{}';
  client_created timestamptz[] := '{}';
  deal_ids uuid[] := '{}';
  deal_clients uuid[] := '{}';
  new_id uuid;
  pick_client uuid;
  pick_deal uuid;
  inv_total bigint;
  due date;
  stage_name public.deal_stage;

  client_names text[] := array[
    'Northwind Studio', 'Bluefin Analytics', 'Oksana Kovalenko', 'Harbor & Pine', 'Lumen Health',
    'Kyiv Coffee Lab', 'Maple Ridge Realty', 'James Whitaker', 'Brightpath Academy', 'Nordic Furniture Co',
    'Vega Logistics', 'Sofia Marquez', 'Atlas Fitness', 'Greenleaf Organics', 'Pixel Forge Games',
    'Andriy Melnyk', 'Summit Legal', 'Coastal Yoga', 'Redwood Ventures', 'Lviv Craft Brewery',
    'Emma Schneider', 'Orbit SaaS', 'Silverline Dental', 'Kinetic Robotics', 'Polar Travel'];
  client_types public.client_type[] := array[
    'company', 'company', 'individual', 'company', 'company',
    'company', 'company', 'individual', 'company', 'company',
    'company', 'individual', 'company', 'company', 'company',
    'individual', 'company', 'company', 'company', 'company',
    'individual', 'company', 'company', 'company', 'company'];
  countries text[] := array[
    'United States', 'United Kingdom', 'Ukraine', 'Canada', 'Germany',
    'Ukraine', 'United States', 'United Kingdom', 'Australia', 'Sweden',
    'Netherlands', 'Spain', 'United States', 'Germany', 'Poland',
    'Ukraine', 'United States', 'Portugal', 'United States', 'Ukraine',
    'Germany', 'Ireland', 'Canada', 'Switzerland', 'Norway'];
  sources public.client_source[] := array['upwork', 'referral', 'direct', 'upwork', 'other'];
  tag_sets text[] := array['{retainer,web}', '{design}', '{}', '{web,priority}', '{mobile}',
                           '{long-term}', '{web}', '{design,priority}', '{}', '{retainer}'];
  contact_names text[] := array[
    'Olivia Grant', 'Liam Carter', 'Mia Novak', 'Noah Fischer', 'Ava Brooks',
    'Ethan Moreau', 'Chloe Petrenko', 'Lucas Berg', 'Zoe Lindqvist', 'Mason Hale'];
  job_titles text[] := array['CEO', 'Marketing Manager', 'Product Owner', 'CTO', 'Operations Lead'];

  -- Final stage of each of the 30 deals (older deals are more often closed).
  deal_stages public.deal_stage[] := array[
    'won', 'lost', 'won', 'won', 'lost', 'won', 'negotiation', 'won', 'lost', 'won',
    'proposal_sent', 'won', 'lost', 'negotiation', 'won', 'proposal_sent', 'lost', 'lead',
    'negotiation', 'won', 'proposal_sent', 'lead', 'negotiation', 'proposal_sent', 'lead',
    'negotiation', 'proposal_sent', 'lead', 'proposal_sent', 'lead'];
  deal_names text[] := array[
    'Website redesign', 'Brand identity', 'Landing page', 'Mobile app MVP', 'SEO audit',
    'E-commerce store', 'Dashboard UI', 'Maintenance retainer', 'Booking system', 'Marketing site'];
  lost_reasons public.deal_lost_reason[] := array[
    'price', 'chose_another_freelancer', 'no_budget', 'no_response', 'other'];

  task_titles text[] := array[
    'Send proposal', 'Follow up on invoice', 'Prepare wireframes', 'Schedule kick-off call',
    'Review feedback', 'Update project estimate', 'Deploy staging build', 'Write case study',
    'Send contract for signature', 'Collect content from client', 'Fix reported bugs',
    'Prepare monthly report', 'Check payment status', 'Plan sprint', 'Record demo video',
    'Ask for a testimonial', 'Renew domain', 'Back up project files', 'Update portfolio',
    'Clarify requirements'];
  priorities public.task_priority[] := array['high', 'medium', 'low', 'medium'];

  -- Final status of each of the 20 invoices, oldest first.
  invoice_statuses public.invoice_status[] := array[
    'paid', 'paid', 'void', 'paid', 'paid', 'paid', 'partially_paid', 'paid', 'paid', 'void',
    'paid', 'sent', 'paid', 'partially_paid', 'paid', 'sent', 'partially_paid', 'sent',
    'draft', 'draft'];
  item_names text[] := array[
    'UI/UX design', 'Frontend development', 'Backend API', 'Consulting', 'Maintenance retainer',
    'Landing page', 'QA and bug fixing', 'Copywriting'];
  methods public.payment_method[] := array['bank_transfer', 'upwork', 'payoneer', 'wise', 'other'];
  manual_types public.activity_type[] := array['call', 'meeting', 'message', 'note'];
  manual_bodies text[] := array[
    'Intro call: discussed goals, timeline and budget.',
    'Kick-off meeting. Agreed on weekly check-ins.',
    'Sent a follow-up message with the next steps.',
    'Prefers async updates; invoices go to accounting.'];
begin
  select m.user_id, p.timezone into owner_id, tz
    from public.workspace_members m
    join public.profiles p on p.id = m.user_id
    where m.workspace_id = ws and m.role = 'owner';
  if owner_id is null then
    raise exception 'Workspace not found' using errcode = '23503';
  end if;
  today := (now() at time zone tz)::date;

  update public.workspaces set
    name = 'Demo workspace',
    currency = 'USD',
    business_name = 'FOP Demo Freelancer',
    business_address = '1 Khreshchatyk St, Kyiv, 01001, Ukraine',
    tax_id = '1234567890',
    iban = 'UA573220010000026007233566001',
    bank_name = 'Demo Bank',
    is_vat_payer = false
  where id = ws;

  -- Clients: one every two weeks, from ~12 months ago to 10 days ago. ---------
  for i in 1 .. 25 loop
    ts := now() - make_interval(days => (25 - i) * 14 + 10);
    perform set_config('clientdesk.activity_at', ts::text, true);
    insert into public.clients
      (workspace_id, type, name, email, phone, country, source, tags, created_at)
    values (
      ws, client_types[i], client_names[i],
      lower(regexp_replace(client_names[i], '[^A-Za-z]+', '', 'g')) || '@example.com',
      '+1 555 01' || lpad(i::text, 2, '0'),
      countries[i], sources[(i - 1) % 5 + 1], tag_sets[(i - 1) % 10 + 1]::text[], ts)
    returning id into new_id;
    client_ids := client_ids || new_id;
    client_created := client_created || ts;

    if client_types[i] = 'company' then
      insert into public.client_contacts
        (workspace_id, client_id, name, job_title, email, is_primary, created_at)
      values (ws, new_id, contact_names[(i - 1) % 10 + 1], job_titles[(i - 1) % 5 + 1],
        lower(split_part(contact_names[(i - 1) % 10 + 1], ' ', 1)) || '@example.com', true, ts);
    end if;

    -- A few manual entries on the older clients (ACT-2).
    if i <= 12 then
      insert into public.activity_events
        (workspace_id, source, type, occurred_at, body, client_id, created_by)
      values (ws, 'manual', manual_types[(i - 1) % 4 + 1], ts + interval '3 days 4 hours',
        manual_bodies[(i - 1) % 4 + 1], new_id, owner_id);
    end if;
  end loop;

  -- Two archived clients.
  perform set_config('clientdesk.activity_at', (now() - interval '40 days')::text, true);
  update public.clients set archived_at = now() - interval '40 days'
    where id in (client_ids[4], client_ids[9]);

  -- Deals: every 11 days. The client is one that existed before the deal. ----
  for j in 1 .. 30 loop
    ts := now() - make_interval(days => (31 - j) * 11);
    cnt := 0;
    for i in 1 .. 25 loop
      if client_created[i] < ts - interval '2 days' then cnt := i; end if;
    end loop;
    pick_client := client_ids[greatest(1, (j * 7) % greatest(cnt, 1) + 1)];
    stage_name := deal_stages[j];

    perform set_config('clientdesk.activity_at', ts::text, true);
    insert into public.deals
      (workspace_id, client_id, name, amount_cents, expected_close_date, stage, position,
       source, created_at)
    values (ws, pick_client, deal_names[(j - 1) % 10 + 1],
      50000 + ((j * 37) % 23) * 50000,
      case when stage_name in ('won', 'lost') then (ts + interval '30 days')::date
           else today + ((j % 6) - 1) * 9 end,
      'lead', j, sources[(j - 1) % 5 + 1], ts)
    returning id into new_id;
    deal_ids := deal_ids || new_id;
    deal_clients := deal_clients || pick_client;

    if stage_name <> 'lead' then
      ts2 := least(ts + make_interval(days => 6 + j % 9), now() - interval '1 day');
      perform set_config('clientdesk.activity_at', ts2::text, true);
      if stage_name in ('won', 'lost') then
        update public.deals set
          stage = stage_name,
          closed_at = ts2,
          lost_reason = case when stage_name = 'lost' then lost_reasons[(j - 1) % 5 + 1] end,
          lost_comment = case when stage_name = 'lost' and lost_reasons[(j - 1) % 5 + 1] = 'other'
                              then 'Project put on hold.' end
        where id = new_id;
      else
        update public.deals set stage = stage_name where id = new_id;
      end if;
    end if;
  end loop;

  perform set_config('clientdesk.activity_at', (now() - interval '20 days')::text, true);
  update public.deals set archived_at = now() - interval '20 days' where id = deal_ids[2];

  -- Tasks: 12 done, 6 overdue, 5 today, 4 tomorrow, 4 this week, 5 later,
  -- 4 without a due date. ---------------------------------------------------
  for k in 1 .. 40 loop
    due := case
      when k <= 12 then today - k * 9
      when k <= 18 then today - (k - 12) * 2
      when k <= 23 then today
      when k <= 27 then today + 1
      when k <= 31 then today + (k - 26)
      when k <= 36 then today + (k - 31) * 6 + 4
      else null
    end;
    ts := least(coalesce(due::timestamptz, now()) - interval '7 days', now() - interval '1 hour');
    pick_deal := case when k % 3 <> 0 then deal_ids[(k * 7) % 30 + 1] end;
    pick_client := case
      when pick_deal is not null then deal_clients[(k * 7) % 30 + 1]
      when k % 3 = 0 and k % 2 = 0 then client_ids[(k * 5) % 25 + 1]
    end;
    if pick_deal is not null and (select d.created_at from public.deals d where d.id = pick_deal) > ts then
      pick_deal := null;
      pick_client := null;
    end if;

    perform set_config('clientdesk.activity_at', ts::text, true);
    insert into public.tasks
      (workspace_id, client_id, deal_id, title, due_date, due_time, priority, created_at)
    values (ws, pick_client, pick_deal, task_titles[(k - 1) % 20 + 1], due,
      case when k in (19, 21) then time '10:00' when k = 22 then time '14:30' end,
      priorities[(k - 1) % 4 + 1], ts)
    returning id into new_id;

    if k <= 12 then
      ts2 := least(due::timestamptz + interval '15 hours', now() - interval '1 hour');
      perform set_config('clientdesk.activity_at', ts2::text, true);
      update public.tasks set status = 'done', completed_at = ts2 where id = new_id;
    end if;
  end loop;

  -- Invoices: every 17 days, oldest first so numbers follow dates. ----------
  for n in 1 .. 20 loop
    ts := now() - make_interval(days => (20 - n) * 17 + 5);
    cnt := 0;
    for i in 1 .. 25 loop
      if client_created[i] < ts - interval '5 days' then cnt := i; end if;
    end loop;
    pick_client := client_ids[greatest(1, (n * 3) % greatest(cnt, 1) + 1)];

    perform set_config('clientdesk.activity_at', ts::text, true);
    insert into public.invoices (workspace_id, client_id, issue_date, due_date, note, created_at)
    values (ws, pick_client, (ts at time zone tz)::date,
      (ts at time zone tz)::date + case when n in (17, 18) then 60 else 14 end,
      case when n % 4 = 0 then 'Thank you for your business!' end, ts)
    returning id into new_id;

    for i in 1 .. (n % 3) + 1 loop
      insert into public.invoice_items
        (workspace_id, invoice_id, position, description, quantity, unit_price_cents)
      values (ws, new_id, i, item_names[(n + i) % 8 + 1],
        case when i = 1 then 1 else ((n + i) % 12 + 4) * 1.5 end,
        case when i = 1 then 40000 + (n % 5) * 25000 else 4500 end);
    end loop;

    if invoice_statuses[n] <> 'draft' then
      update public.invoices set status = 'sent', sent_at = ts + interval '1 hour' where id = new_id;
    end if;

    select total_cents into inv_total from public.invoices where id = new_id;

    if invoice_statuses[n] = 'paid' then
      if n % 2 = 0 then
        ts2 := least(ts + interval '6 days', now() - interval '1 day');
        perform set_config('clientdesk.activity_at', ts2::text, true);
        insert into public.payments (workspace_id, invoice_id, amount_cents, paid_on, method, created_at)
        values (ws, new_id, inv_total / 2, (ts2 at time zone tz)::date, methods[n % 5 + 1], ts2);
        ts2 := least(ts + interval '12 days', now() - interval '1 day');
        perform set_config('clientdesk.activity_at', ts2::text, true);
        insert into public.payments (workspace_id, invoice_id, amount_cents, paid_on, method, created_at)
        values (ws, new_id, inv_total - inv_total / 2, (ts2 at time zone tz)::date,
          methods[n % 5 + 1], ts2);
      else
        ts2 := least(ts + interval '9 days', now() - interval '1 day');
        perform set_config('clientdesk.activity_at', ts2::text, true);
        insert into public.payments (workspace_id, invoice_id, amount_cents, paid_on, method, created_at)
        values (ws, new_id, inv_total, (ts2 at time zone tz)::date, methods[n % 5 + 1], ts2);
      end if;
    elsif invoice_statuses[n] = 'partially_paid' then
      ts2 := least(ts + interval '8 days', now() - interval '1 day');
      perform set_config('clientdesk.activity_at', ts2::text, true);
      insert into public.payments (workspace_id, invoice_id, amount_cents, paid_on, method, created_at)
      values (ws, new_id, round(inv_total * 0.4)::bigint, (ts2 at time zone tz)::date,
        methods[n % 5 + 1], ts2);
    elsif invoice_statuses[n] = 'void' then
      ts2 := ts + interval '20 days';
      perform set_config('clientdesk.activity_at', ts2::text, true);
      update public.invoices set status = 'void', voided_at = ts2 where id = new_id;
    end if;
  end loop;

  perform set_config('clientdesk.activity_at', '', true);
end;
$$;

-- Removes all business data of a workspace (used by reset).
create function public.clear_workspace_data(ws uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- Order respects the "no action" foreign keys (invoices/deals -> clients).
  delete from public.invoices where workspace_id = ws;
  delete from public.tasks where workspace_id = ws;
  delete from public.deals where workspace_id = ws;
  delete from public.clients where workspace_id = ws;
  delete from public.activity_events where workspace_id = ws;
  delete from public.invoice_counters where workspace_id = ws;
end;
$$;

-- The caller's owned workspace, only for anonymous (demo) users.
create function public.demo_workspace_id()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  uid uuid := (select auth.uid());
  ws uuid;
begin
  if uid is null
     or not coalesce((select u.is_anonymous from auth.users u where u.id = uid), false) then
    raise exception 'Demo data is only available in demo mode' using errcode = '42501';
  end if;

  select m.workspace_id into ws
    from public.workspace_members m
    where m.user_id = uid and m.role = 'owner';
  if ws is null then
    raise exception 'Workspace not found' using errcode = '23503';
  end if;
  return ws;
end;
$$;

revoke execute on function public.generate_demo_data(uuid) from public, anon, authenticated;
revoke execute on function public.clear_workspace_data(uuid) from public, anon, authenticated;
revoke execute on function public.demo_workspace_id() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- RPC: seed an empty demo workspace (right after signInAnonymously).
-- ---------------------------------------------------------------------------
create function public.seed_demo_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  ws uuid := public.demo_workspace_id();
begin
  if exists (select 1 from public.clients c where c.workspace_id = ws) then
    raise exception 'The demo workspace already has data' using errcode = '23505';
  end if;
  perform public.generate_demo_data(ws);
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC: "Reset demo data" in the demo banner.
-- ---------------------------------------------------------------------------
create function public.reset_demo_data()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  ws uuid := public.demo_workspace_id();
begin
  perform public.clear_workspace_data(ws);
  perform public.generate_demo_data(ws);
end;
$$;

revoke execute on function public.seed_demo_data() from public, anon;
revoke execute on function public.reset_demo_data() from public, anon;
grant execute on function public.seed_demo_data() to authenticated;
grant execute on function public.reset_demo_data() to authenticated;

-- ---------------------------------------------------------------------------
-- Cleanup: delete anonymous accounts older than 7 days. The user-delete
-- trigger removes each workspace with all its data.
-- ---------------------------------------------------------------------------
create function public.cleanup_demo_accounts()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted integer;
begin
  delete from auth.users u
  where u.is_anonymous
    and u.created_at < now() - interval '7 days';
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

revoke execute on function public.cleanup_demo_accounts() from public, anon, authenticated;

create extension if not exists pg_cron;

select cron.schedule(
  'cleanup-demo-accounts',
  '17 3 * * *',
  'select public.cleanup_demo_accounts()'
);
