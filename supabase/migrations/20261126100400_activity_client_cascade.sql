-- Fix: deleting a client that has manual activity entries failed.
--
-- activity_events.client_id was `on delete set null`, but manual entries must
-- have a client (activity_manual_shape), so the set-null violated the check.
-- A client's feed now goes with the client. This loses no other history: a
-- client with deals or invoices cannot be deleted (those FKs are "no action"),
-- so only the client's own events and notes are removed.

alter table public.activity_events
  drop constraint activity_events_workspace_id_client_id_fkey,
  add constraint activity_events_workspace_id_client_id_fkey
    foreign key (workspace_id, client_id)
    references public.clients (workspace_id, id) on delete cascade;
