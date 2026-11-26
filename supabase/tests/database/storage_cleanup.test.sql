-- Logo bucket policies, search indexes and orphan workspace cleanup.
begin;

create extension if not exists pgtap with schema extensions;

select plan(9);

insert into auth.users (id, email, aud, role) values
  ('a1a1a1a1-0000-0000-0000-000000000001', 'logo-a@test.local', 'authenticated', 'authenticated'),
  ('b1b1b1b1-0000-0000-0000-000000000002', 'logo-b@test.local', 'authenticated', 'authenticated');

create temp table ws as
  select user_id as owner_id, workspace_id as id from public.workspace_members
  where user_id in ('a1a1a1a1-0000-0000-0000-000000000001', 'b1b1b1b1-0000-0000-0000-000000000002');
grant select on ws to authenticated;

select ok((select not public and file_size_limit = 1048576
                  and not ('image/svg+xml' = any (allowed_mime_types))
           from storage.buckets where id = 'logos'),
  'logos bucket is private, 1 MB, no SVG');

select has_index('public', 'clients', 'clients_name_trgm_idx', 'client name has a trigram index');

-- As A ------------------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims',
  '{"sub":"a1a1a1a1-0000-0000-0000-000000000001","role":"authenticated"}', true);

select lives_ok(format($$
  insert into storage.objects (bucket_id, name, owner_id)
  values ('logos', '%s/logo.png', 'a1a1a1a1-0000-0000-0000-000000000001')
$$, (select id from ws where owner_id = 'a1a1a1a1-0000-0000-0000-000000000001')),
  'a member can upload into their workspace folder');

select throws_ok(format($$
  insert into storage.objects (bucket_id, name, owner_id)
  values ('logos', '%s/logo.png', 'a1a1a1a1-0000-0000-0000-000000000001')
$$, (select id from ws where owner_id = 'b1b1b1b1-0000-0000-0000-000000000002')),
  '42501', null, 'a member cannot upload into another workspace folder');

select throws_ok($$
  insert into storage.objects (bucket_id, name, owner_id)
  values ('logos', 'not-a-uuid/logo.png', 'a1a1a1a1-0000-0000-0000-000000000001')
$$, '42501', null, 'a path outside any workspace folder is rejected');

select throws_ok(format($$
  update public.workspaces set logo_path = '%s/logo.png'
$$, (select id from ws where owner_id = 'b1b1b1b1-0000-0000-0000-000000000002')),
  '23514', null, 'logo_path must point into the own workspace folder');

-- As B ------------------------------------------------------------------------
select set_config('request.jwt.claims',
  '{"sub":"b1b1b1b1-0000-0000-0000-000000000002","role":"authenticated"}', true);

select is((select count(*)::int from storage.objects where bucket_id = 'logos'), 0,
  'B cannot see the logo of workspace A');

-- Orphan cleanup (as postgres) ------------------------------------------------
reset role;
insert into public.clients (workspace_id, name)
select id, 'Kept until owner leaves' from ws where owner_id = 'b1b1b1b1-0000-0000-0000-000000000002';
delete from auth.users where id = 'b1b1b1b1-0000-0000-0000-000000000002';

select is((select count(*)::int from public.workspaces
           where id = (select id from ws where owner_id = 'b1b1b1b1-0000-0000-0000-000000000002')),
  0, 'deleting a user deletes their workspace');
select is((select count(*)::int from public.clients where name = 'Kept until owner leaves'), 0,
  'the workspace data is deleted with it');

select * from finish();
rollback;
