-- Lifecycle timestamps set by the database, not the client.
--
-- deals.closed_at: set when the deal enters won/lost, cleared when it leaves.
-- tasks.completed_at: set when the task becomes done, cleared when reopened.
--
-- On INSERT a value given by the caller is kept (the demo seed back-dates
-- history); otherwise now() is used. On UPDATE the value can only change
-- together with the stage/status, so the client cannot rewrite it.

create function public.deals_set_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  is_closing boolean := new.stage in ('won', 'lost');
begin
  if not is_closing then
    new.closed_at := null;
  elsif tg_op = 'INSERT' then
    new.closed_at := coalesce(new.closed_at, now());
  elsif old.stage is distinct from new.stage then
    new.closed_at := now();
  else
    new.closed_at := old.closed_at;
  end if;

  -- Leaving Lost (reopen or Won) drops the lost reason (DEAL-4).
  if new.stage <> 'lost' then
    new.lost_reason := null;
    new.lost_comment := null;
  end if;

  return new;
end;
$$;

create function public.tasks_set_lifecycle()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status <> 'done' then
    new.completed_at := null;
  elsif tg_op = 'INSERT' then
    new.completed_at := coalesce(new.completed_at, now());
  elsif old.status is distinct from new.status then
    new.completed_at := now();
  else
    new.completed_at := old.completed_at;
  end if;

  return new;
end;
$$;

revoke execute on function public.deals_set_lifecycle() from public, anon, authenticated;
revoke execute on function public.tasks_set_lifecycle() from public, anon, authenticated;

create trigger deals_set_lifecycle
  before insert or update on public.deals
  for each row execute function public.deals_set_lifecycle();

create trigger tasks_set_lifecycle
  before insert or update on public.tasks
  for each row execute function public.tasks_set_lifecycle();
