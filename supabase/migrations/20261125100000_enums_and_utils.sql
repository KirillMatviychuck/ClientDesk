-- Enum types for statuses, stages and fixed lists, plus shared utility functions.
-- Labels are lowercase snake_case; the UI maps them to display text.

create type public.workspace_role as enum ('owner', 'admin', 'member');

create type public.currency_code as enum ('UAH', 'USD', 'EUR');

create type public.client_type as enum ('company', 'individual');

create type public.client_source as enum ('upwork', 'referral', 'direct', 'other');

create type public.deal_stage as enum ('lead', 'proposal_sent', 'negotiation', 'won', 'lost');

create type public.deal_lost_reason as enum (
  'price',
  'chose_another_freelancer',
  'no_budget',
  'no_response',
  'other'
);

create type public.task_status as enum ('todo', 'done');

create type public.task_priority as enum ('low', 'medium', 'high');

-- "overdue" is not stored: it is computed from due_date and the payment state.
create type public.invoice_status as enum ('draft', 'sent', 'partially_paid', 'paid', 'void');

create type public.payment_method as enum ('bank_transfer', 'upwork', 'payoneer', 'wise', 'other');

create type public.activity_source as enum ('system', 'manual');

create type public.activity_type as enum (
  -- manual entries (ACT-2)
  'call',
  'meeting',
  'message',
  'note',
  -- system events written by triggers (ACT-1)
  'client_created',
  'client_updated',
  'client_archived',
  'client_restored',
  'deal_created',
  'deal_updated',
  'deal_stage_changed',
  'deal_archived',
  'deal_reopened',
  'task_created',
  'task_completed',
  'invoice_status_changed',
  'payment_recorded',
  'payment_deleted'
);

-- Keeps updated_at current on every UPDATE.
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
