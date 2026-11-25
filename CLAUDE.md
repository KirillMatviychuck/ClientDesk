# ClientDesk

Mini-CRM for small service businesses: clients, deals pipeline, tasks, invoices, dashboard.

## Stack
React + TypeScript (strict) + Vite, React Router, TanStack Query, TanStack Table,
React Hook Form + Zod, Tailwind CSS + shadcn/ui, Recharts, dnd-kit, Supabase (Postgres, Auth, RLS).
Tests: Vitest + Testing Library, Playwright.

## Architecture: Feature-Sliced Design
Layers (imports only downward): app → pages → widgets → features → entities → shared.
- Slices on the same layer never import each other. Entities may share types via @x only.
- Import a slice only through its index.ts (public API). Never deep-import.
- Segments: ui/ (components), model/ (types, schemas, hooks, logic), api/ (requests, query keys), lib/, config/.
- entities = business data + read queries + simple display. features = one user action (form/button + mutation).
- widgets = self-contained page blocks composed of entities and features. pages = composition only.
- shared contains no business terms (client, deal, invoice). Exception (per FSD reference):
  shared/routes holds route path patterns (ROUTES) and builders (buildPath) — no logic.
- Never hardcode paths: use ROUTES / buildPath from @/shared/routes in links and the router.
- Supabase is called only from api/ segments.

## Conventions
- Money is stored and computed in integer cents; format only for display (shared/lib/money).
- Dates: due dates are `date` without time; "today" is computed in the user's timezone.
- Every screen handles loading (skeleton), empty and error (with retry) states.
- Mutations: invalidate via query-key factories; optimistic updates roll back on error.
- Table state (filters, sort, page) lives in URL search params.
- Code, comments, commits and docs in English. Conventional Commits.
- No `any`. No new dependencies without asking me first.

## Security
- RLS enabled on every table; every business table has workspace_id.
- security definer functions must check workspace membership and set search_path.
- Never use or commit the service_role key in frontend code.

## Commands
npm run dev | typecheck | lint | lint:fsd | test | test:e2e | build
Run typecheck, lint and lint:fsd after every change.

## Workflow
For non-trivial tasks: propose a plan first and wait for my approval.
Work in small steps. After each step, list the files you changed.