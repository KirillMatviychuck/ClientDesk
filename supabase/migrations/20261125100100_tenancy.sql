-- Tenancy: profiles, workspaces and workspace membership.
-- RLS is enabled together with each table, so no table is ever exposed without it.
-- Policies live in the rls_policies migration.

-- One row per auth user. Created by the handle_new_user trigger.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text check (full_name is null or char_length(full_name) <= 200),
  timezone text not null default 'Europe/Kyiv' check (char_length(timezone) between 1 and 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- The account: currency and business details used on invoices (AUTH-5).
create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  currency public.currency_code not null default 'UAH',
  business_name text check (business_name is null or char_length(business_name) <= 200),
  business_address text check (business_address is null or char_length(business_address) <= 500),
  -- RNOKPP (10 digits) or EDRPOU (8 digits).
  tax_id text check (tax_id is null or tax_id ~ '^([0-9]{8}|[0-9]{10})$'),
  -- Format only; the IBAN checksum is validated in the form.
  iban text check (iban is null or iban ~ '^UA[0-9]{27}$'),
  bank_name text check (bank_name is null or char_length(bank_name) <= 200),
  is_vat_payer boolean not null default false,
  logo_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.workspaces enable row level security;

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.workspace_role not null default 'member',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

alter table public.workspace_members enable row level security;

-- Membership lookups by user (used by every RLS check).
create index workspace_members_user_id_idx on public.workspace_members (user_id);

-- Exactly one owner per workspace.
create unique index workspace_members_one_owner_idx
  on public.workspace_members (workspace_id)
  where role = 'owner';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger workspaces_set_updated_at
  before update on public.workspaces
  for each row execute function public.set_updated_at();
