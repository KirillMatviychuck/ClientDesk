-- INV-1: the number year is the issue_date year. When a draft's issue date
-- moves to another year, the draft gets the next number of that year.
-- The old number is not reused (gaps are allowed).
--
-- A separate trigger, because invoices_before_update is security invoker and
-- the counter table is not reachable from API roles. Triggers on the same
-- event fire in name order, so this runs after invoices_before_update (which
-- resets the number columns and rejects edits of non-draft invoices).

create function public.invoices_renumber_on_year_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not public.is_workspace_member(new.workspace_id) then
    raise exception 'Not a member of this workspace' using errcode = '42501';
  end if;

  new.number_year := extract(year from new.issue_date)::smallint;
  insert into public.invoice_counters as c (workspace_id, year, last_seq)
  values (new.workspace_id, new.number_year, 1)
  on conflict (workspace_id, year) do update set last_seq = c.last_seq + 1
  returning c.last_seq into new.number_seq;

  return new;
end;
$$;

revoke execute on function public.invoices_renumber_on_year_change() from public, anon, authenticated;

create trigger invoices_before_update_renumber
  before update of issue_date on public.invoices
  for each row
  when (
    old.status = 'draft'
    and extract(year from new.issue_date) <> extract(year from old.issue_date)
  )
  execute function public.invoices_renumber_on_year_change();
