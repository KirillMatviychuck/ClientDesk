-- Lifecycle timestamps set by the database, not the client.
--
-- deals.closed_at: set when the deal enters won/lost, cleared when it leaves.
-- tasks.completed_at: set when the task becomes done, cleared when reopened.
--
-- A value given by the caller together with the transition (INSERT, or an
-- UPDATE that changes the stage/status) is kept, so history can be
-- back-dated (the demo seed does this); otherwise now() is used. While the
-- stage/status stays the same the value is frozen.

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
    if new.closed_at is not distinct from old.closed_at then
      new.closed_at := now();
    end if;
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
    if new.completed_at is not distinct from old.completed_at then
      new.completed_at := now();
    end if;
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
