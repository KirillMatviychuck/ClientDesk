-- Local development seed. Runs after migrations on `supabase db reset`.
-- Never runs against a hosted project.
--
-- Creates a confirmed email user with demo data:
--   email:    dev@clientdesk.test
--   password: clientdesk-dev
-- These are local test credentials only.

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values (
  '00000000-0000-0000-0000-000000000000',
  '0de0de0d-0000-4000-8000-000000000001',
  'authenticated', 'authenticated', 'dev@clientdesk.test',
  extensions.crypt('clientdesk-dev', extensions.gen_salt('bf')), now(),
  '{"provider": "email", "providers": ["email"]}', '{"full_name": "Dev User"}', now(), now(),
  '', '', '', ''
);

insert into auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) values (
  gen_random_uuid(),
  '0de0de0d-0000-4000-8000-000000000001',
  '0de0de0d-0000-4000-8000-000000000001',
  '{"sub": "0de0de0d-0000-4000-8000-000000000001", "email": "dev@clientdesk.test", "email_verified": true}',
  'email', now(), now(), now()
);

select public.generate_demo_data(m.workspace_id)
from public.workspace_members m
where m.user_id = '0de0de0d-0000-4000-8000-000000000001' and m.role = 'owner';
