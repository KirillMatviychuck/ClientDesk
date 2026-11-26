-- Business tables. Every table has workspace_id.
--
-- Money: bigint integer cents. Due/close/issue dates: `date` without time.
--
-- Cross-workspace protection: each parent table has unique (workspace_id, id),
-- and children reference the pair, e.g. deals (workspace_id, client_id) ->
-- clients (workspace_id, id). RLS only checks the row's own workspace_id, so
-- without this a user could link their deal to another workspace's client by
-- guessing its UUID. `on delete set null (col)` clears only the reference,
-- never workspace_id.

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------
create table public.clients (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  type public.client_type not null default 'company',
  name text not null check (char_length(btrim(name)) between 1 and 200),
  email text check (email is null or char_length(email) <= 320),
  phone text check (phone is null or char_length(phone) <= 50),
  website text check (website is null or char_length(website) <= 500),
  country text check (country is null or char_length(country) <= 100),
  source public.client_source not null default 'other',
  tax_number text check (tax_number is null or char_length(tax_number) <= 50),
  address text check (address is null or char_length(address) <= 500),
  notes text check (notes is null or char_length(notes) <= 5000),
  tags text[] not null default '{}',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id)
);

alter table public.clients enable row level security;

create index clients_workspace_created_at_idx on public.clients (workspace_id, created_at desc);
create index clients_workspace_name_idx on public.clients (workspace_id, name);
create index clients_tags_idx on public.clients using gin (tags);

-- ---------------------------------------------------------------------------
-- client_contacts
-- ---------------------------------------------------------------------------
create table public.client_contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 200),
  job_title text check (job_title is null or char_length(job_title) <= 200),
  email text check (email is null or char_length(email) <= 320),
  phone text check (phone is null or char_length(phone) <= 50),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, client_id)
    references public.clients (workspace_id, id) on delete cascade
);

alter table public.client_contacts enable row level security;

create index client_contacts_workspace_id_idx on public.client_contacts (workspace_id);
create index client_contacts_client_id_idx on public.client_contacts (client_id);
-- At most one primary contact per client.
create unique index client_contacts_one_primary_idx
  on public.client_contacts (client_id)
  where is_primary;

-- ---------------------------------------------------------------------------
-- deals
-- ---------------------------------------------------------------------------
create table public.deals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid not null,
  name text not null check (char_length(btrim(name)) between 1 and 200),
  amount_cents bigint not null default 0 check (amount_cents >= 0),
  expected_close_date date,
  stage public.deal_stage not null default 'lead',
  -- Order within a Kanban column (fractional, so a move updates one row).
  position double precision not null default 0,
  source public.client_source not null default 'other',
  description text check (description is null or char_length(description) <= 5000),
  closed_at timestamptz,
  lost_reason public.deal_lost_reason,
  lost_comment text check (lost_comment is null or char_length(lost_comment) <= 1000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, client_id)
    references public.clients (workspace_id, id) on delete no action,
  -- Won/Lost are closing stages and carry a close time (DEAL-4).
  constraint deals_closed_at_matches_stage
    check ((stage in ('won', 'lost')) = (closed_at is not null)),
  -- Lost requires a reason; other stages must not have one.
  constraint deals_lost_reason_matches_stage
    check ((stage = 'lost') = (lost_reason is not null)),
  -- "Other" requires a comment.
  constraint deals_other_reason_has_comment
    check (lost_reason is distinct from 'other' or nullif(btrim(lost_comment), '') is not null)
);

alter table public.deals enable row level security;

create index deals_workspace_stage_position_idx on public.deals (workspace_id, stage, position);
create index deals_workspace_client_id_idx on public.deals (workspace_id, client_id);
create index deals_workspace_expected_close_idx on public.deals (workspace_id, expected_close_date);
create index deals_workspace_closed_at_idx on public.deals (workspace_id, closed_at desc);

-- ---------------------------------------------------------------------------
-- tasks
-- ---------------------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid,
  deal_id uuid,
  title text not null check (char_length(btrim(title)) between 1 and 300),
  description text check (description is null or char_length(description) <= 5000),
  due_date date,
  due_time time,
  priority public.task_priority not null default 'medium',
  status public.task_status not null default 'todo',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, client_id)
    references public.clients (workspace_id, id) on delete set null (client_id),
  foreign key (workspace_id, deal_id)
    references public.deals (workspace_id, id) on delete set null (deal_id),
  constraint tasks_time_needs_date check (due_time is null or due_date is not null),
  constraint tasks_completed_at_matches_status
    check ((status = 'done') = (completed_at is not null))
);

alter table public.tasks enable row level security;

create index tasks_workspace_status_due_idx on public.tasks (workspace_id, status, due_date);
create index tasks_workspace_created_at_idx on public.tasks (workspace_id, created_at desc);
create index tasks_client_id_idx on public.tasks (client_id);
create index tasks_deal_id_idx on public.tasks (deal_id);

-- ---------------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------------
create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  client_id uuid not null,
  deal_id uuid,
  -- Assigned by a numbering trigger (added with the invoices module).
  number_year smallint not null check (number_year between 2000 and 2999),
  number_seq integer not null check (number_seq > 0),
  number text generated always as (
    'INV-' || number_year::text || '-' || lpad(number_seq::text, 4, '0')
  ) stored,
  issue_date date not null default current_date,
  due_date date not null,
  status public.invoice_status not null default 'draft',
  -- Snapshot of the workspace currency at creation (amounts are never converted).
  currency public.currency_code not null,
  -- VAT rate in basis points: 2000 = 20 %. null = "VAT not applicable".
  vat_rate_bp smallint check (vat_rate_bp is null or vat_rate_bp in (0, 700, 2000)),
  subtotal_cents bigint not null default 0 check (subtotal_cents >= 0),
  vat_cents bigint not null default 0 check (vat_cents >= 0),
  total_cents bigint not null default 0 check (total_cents >= 0),
  paid_cents bigint not null default 0 check (paid_cents >= 0),
  note text check (note is null or char_length(note) <= 2000),
  sent_at timestamptz,
  voided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (workspace_id, number_year, number_seq),
  foreign key (workspace_id, client_id)
    references public.clients (workspace_id, id) on delete no action,
  foreign key (workspace_id, deal_id)
    references public.deals (workspace_id, id) on delete set null (deal_id),
  constraint invoices_due_after_issue check (due_date >= issue_date),
  constraint invoices_paid_not_above_total check (paid_cents <= total_cents)
);

alter table public.invoices enable row level security;

create index invoices_workspace_issue_date_idx on public.invoices (workspace_id, issue_date desc);
create index invoices_workspace_status_due_idx on public.invoices (workspace_id, status, due_date);
create index invoices_workspace_client_id_idx on public.invoices (workspace_id, client_id);
create index invoices_deal_id_idx on public.invoices (deal_id);

-- ---------------------------------------------------------------------------
-- invoice_items
-- ---------------------------------------------------------------------------
create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  invoice_id uuid not null,
  position smallint not null default 0,
  description text not null check (char_length(btrim(description)) between 1 and 500),
  quantity numeric(12, 3) not null check (quantity > 0),
  unit_price_cents bigint not null check (unit_price_cents >= 0),
  line_total_cents bigint not null check (line_total_cents >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, invoice_id)
    references public.invoices (workspace_id, id) on delete cascade
);

alter table public.invoice_items enable row level security;

create index invoice_items_workspace_id_idx on public.invoice_items (workspace_id);
create index invoice_items_invoice_position_idx on public.invoice_items (invoice_id, position);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  invoice_id uuid not null,
  amount_cents bigint not null check (amount_cents > 0),
  paid_on date not null,
  method public.payment_method not null default 'bank_transfer',
  comment text check (comment is null or char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, invoice_id)
    references public.invoices (workspace_id, id) on delete cascade
);

alter table public.payments enable row level security;

create index payments_workspace_paid_on_idx on public.payments (workspace_id, paid_on desc);
create index payments_invoice_id_idx on public.payments (invoice_id);

-- ---------------------------------------------------------------------------
-- activity_events
-- ---------------------------------------------------------------------------
create table public.activity_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  source public.activity_source not null default 'manual',
  type public.activity_type not null,
  occurred_at timestamptz not null default now(),
  body text check (body is null or char_length(body) <= 5000),
  -- Field changes for system events: {"field": {"old": ..., "new": ...}}.
  changes jsonb,
  client_id uuid,
  deal_id uuid,
  task_id uuid,
  invoice_id uuid,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, client_id)
    references public.clients (workspace_id, id) on delete set null (client_id),
  foreign key (workspace_id, deal_id)
    references public.deals (workspace_id, id) on delete set null (deal_id),
  foreign key (workspace_id, task_id)
    references public.tasks (workspace_id, id) on delete set null (task_id),
  foreign key (workspace_id, invoice_id)
    references public.invoices (workspace_id, id) on delete set null (invoice_id),
  -- Manual entries use only the manual types and require a client (ACT-2).
  constraint activity_manual_shape check (
    source = 'system'
    or (type in ('call', 'meeting', 'message', 'note') and client_id is not null)
  ),
  constraint activity_system_types check (
    source = 'manual' or type not in ('call', 'meeting', 'message', 'note')
  )
);

alter table public.activity_events enable row level security;

create index activity_events_workspace_occurred_idx
  on public.activity_events (workspace_id, occurred_at desc);
create index activity_events_client_occurred_idx
  on public.activity_events (client_id, occurred_at desc);
create index activity_events_deal_occurred_idx
  on public.activity_events (deal_id, occurred_at desc);
create index activity_events_task_id_idx on public.activity_events (task_id);
create index activity_events_invoice_id_idx on public.activity_events (invoice_id);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

create trigger client_contacts_set_updated_at
  before update on public.client_contacts
  for each row execute function public.set_updated_at();

create trigger deals_set_updated_at
  before update on public.deals
  for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create trigger invoices_set_updated_at
  before update on public.invoices
  for each row execute function public.set_updated_at();

create trigger invoice_items_set_updated_at
  before update on public.invoice_items
  for each row execute function public.set_updated_at();

create trigger payments_set_updated_at
  before update on public.payments
  for each row execute function public.set_updated_at();

create trigger activity_events_set_updated_at
  before update on public.activity_events
  for each row execute function public.set_updated_at();
