# ClientDesk — Product Requirements Document (v0.2)

## 1. Overview

**ClientDesk** is a mini-CRM for a solo freelancer: clients, a deals pipeline shown as a Kanban board, tasks, invoices, an activity feed, and a dashboard.

**Project context:** this is a demo project for a portfolio on Upwork, not a commercial product. That sets the priorities:
- A visitor (a client on Upwork) must be able to see a working app with one click and no sign-up (demo mode with seeded data).
- Code quality and architecture (FSD, tests, CI) matter more than feature breadth.
- No real payments, no external integrations, and no emails sent to clients.

### User
One role: the **account owner** (the freelancer). Each account sees only its own data. There are no teams, invitations or roles.

### Localization and money
- The interface is **English only**.
- Jurisdiction is **Ukraine**. The default currency is **UAH (₴)**. In settings, the account can be set to one currency: UAH, USD or EUR. There is no multi-currency support within an account.
- Amount format: `₴12,500.00`. Dates use the user's timezone (default `Europe/Kyiv`).

### General requirements (all modules)
- SPA, desktop-first, correct layout from 375px wide.
- Lists support pagination, sorting and search. Loading, empty and error states are handled explicitly.
- Deleting uses a confirmation dialog. Deleting clients and deals is a soft delete (archive). Everything else is a hard delete.
- Data isolation is enforced by **Row Level Security** in Postgres (`user_id = auth.uid()`), not only by filters in the UI.
- All forms are validated with Zod schemas. Errors are shown next to the relevant fields.

---

## 2. Tech stack and architecture

| Area | Decision |
|---|---|
| Build and routing | React + TypeScript + Vite + React Router |
| Server state | TanStack Query |
| UI | Tailwind CSS + shadcn/ui |
| Tables | TanStack Table |
| Forms | React Hook Form + Zod |
| Backend | Supabase (Postgres, Auth, Row Level Security) |
| Charts and drag-and-drop | Recharts, dnd-kit |
| Tests | Vitest + Testing Library, Playwright |
| Architecture linting | Steiger (FSD linter) |
| Deployment and CI | Vercel + GitHub Actions |

- The frontend follows **Feature-Sliced Design**. Steiger runs in CI and must report no errors.
- Business rules that protect data integrity (invoice numbering, invoice status recalculation, activity log) are implemented in the database (triggers and functions), so they do not depend on the client.
- Invoice PDFs are generated on the client.
- CI runs on every PR: typecheck, lint, Steiger, Vitest, Playwright (smoke), and a Vercel preview deployment.

---

## 3. Auth

### AUTH-1. Demo mode
**As** a visitor to the portfolio, **I want** to open the app with one button and no sign-up, **so that** I can evaluate its features right away.

Acceptance criteria:
- The login page has a **Try the demo** button.
- Clicking it creates an anonymous Supabase session and fills the account with demo data: about 25 clients, about 30 deals across all stages, about 40 tasks (including overdue and due-today ones), about 20 invoices in every status, and activity and payment history for the last 12 months.
- Each visitor gets their own isolated copy of the data. One visitor's actions are not visible to another.
- The visitor lands on the dashboard within 3 seconds of clicking.
- The demo session shows a "You're in demo mode" banner with a **Reset demo data** button.
- Anonymous accounts older than 7 days are deleted on a schedule.

### AUTH-2. Sign-up
**As** a new user, **I want** to sign up with email and password, **so that** I have a permanent account.

Acceptance criteria:
- Fields: name, email, password (minimum 8 characters).
- Email is unique. A duplicate shows a clear error.
- Email confirmation and emails are sent through Supabase Auth using its standard templates. No custom mail service.
- After sign-up the account is empty. Empty screens show a hint and a button to create the first record.

### AUTH-3. Log in and log out
**As** a user, **I want** to log in and log out, **so that** my data stays protected.

Acceptance criteria:
- For wrong credentials, show a generic message: "Invalid email or password".
- An unauthenticated user who opens an internal page is redirected to `/login`. After logging in, they return to the original page.
- **Log out** ends the session and clears the TanStack Query cache.

### AUTH-4. Password reset
**As** a user, **I want** to reset a forgotten password, **so that** I can get back into my account.

Acceptance criteria:
- Reset uses the standard Supabase flow: an email with a link, then a page to set a new password.
- The response to a reset request is the same whether or not the email exists.

### AUTH-5. Profile and business details
**As** a user, **I want** to enter my details and business requisites, **so that** they appear on my invoices.

Acceptance criteria:
- Profile fields: name, timezone, account currency (UAH / USD / EUR).
- Business details for invoices: name or sole-proprietor (FOP) name, address, RNOKPP or EDRPOU tax ID (10 or 8 digits), IBAN (format `UA` + 27 digits, validated with its checksum), bank name, a "VAT payer" flag, and an optional logo (up to 1 MB).
- If the account currency is changed while invoices exist, show a warning that amounts are not converted.

---

## 4. Clients

### CLI-1. Create a client
**As** a freelancer, **I want** to add a client, **so that** I can keep their information.

Acceptance criteria:
- Fields: type (company / individual), name (required), email, phone, website, country, source (Upwork, Referral, Direct, Other), tax number, address, notes, tags.
- Email, phone and URL are validated by format.
- If an existing client has the same email or name, show a possible-duplicate warning. Saving is not blocked.

### CLI-2. Contact persons
**As** a freelancer, **I want** to add contact persons to a company client, **so that** I know who to talk to.

Acceptance criteria:
- A contact has a name (required), a job title, email and phone. One contact can be marked as primary.
- Contacts are shown and edited on the client's detail page.

### CLI-3. Client list
**As** a freelancer, **I want** to see a searchable, filterable client list, **so that** I can find a client quickly.

Acceptance criteria:
- Table (TanStack Table) with: name, primary contact, email, source, tags, open deal total, unpaid invoice total, created date.
- Search by name, email and contact name (case-insensitive, substring match, with debounce).
- Filters: source, tags, archived. Sorting works on every column.
- Filter, sort and page state is stored in the URL.

### CLI-4. Client detail page
**As** a freelancer, **I want** to open a client's detail page, **so that** I can see the full history of working with them.

Acceptance criteria:
- Tabs: Overview (details, contacts), Deals, Tasks, Invoices, Activity.
- Totals: earned (sum of payments), unpaid, and open deal value.
- From this page you can create a deal, a task or an invoice with the client pre-filled.

### CLI-5. Edit and archive
**As** a freelancer, **I want** to edit and archive clients, **so that** the database stays up to date.

Acceptance criteria:
- Field changes are logged in the activity feed (old value → new value).
- Archiving hides the client from the list by default. Their deals, tasks and invoices are kept. The client can be restored.
- A client who has invoices (other than drafts) cannot be permanently deleted. They can only be archived.

### CLI-6. CSV export
**As** a freelancer, **I want** to export clients to CSV, **so that** I can use the data outside the CRM.

Acceptance criteria:
- The current filtered list is exported as UTF-8 with English headers.

---

## 5. Deals (Kanban)

### DEAL-1. Pipeline stages
**As** a freelancer, **I want** clear pipeline stages, **so that** I can track progress on each project.

Acceptance criteria:
- Fixed stages: **Lead → Proposal Sent → Negotiation → Won / Lost**.
- Won and Lost are closing stages. On the board they appear as collapsed columns showing the count and total for the last 30 days.

### DEAL-2. Create a deal
**As** a freelancer, **I want** to create a deal, **so that** I can track a potential project.

Acceptance criteria:
- Fields: name (required), client (required), amount, expected close date, stage (defaults to Lead), source (inherited from the client), description.
- Amount is a non-negative number with 2 decimal places, in the account currency.
- A new deal appears on the board without a page reload (query invalidation or an optimistic update).

### DEAL-3. Kanban board
**As** a freelancer, **I want** to drag deals between stages, **so that** I can manage the pipeline visually.

Acceptance criteria:
- One column per stage. The column header shows the number of deals and their total amount.
- Card: name, client, amount, expected close date (shown in red if it has passed).
- Drag-and-drop (dnd-kit) changes the stage and the order within a column. Updates are optimistic. If the server rejects a change, the card returns to its place and a toast is shown.
- Drag-and-drop works from the keyboard (dnd-kit accessibility support).
- Filters: client, source, amount range. A **Board / Table** toggle.

### DEAL-4. Close a deal
**As** a freelancer, **I want** to mark a deal as won or lost, **so that** the outcome is recorded.

Acceptance criteria:
- Moving a deal to Lost requires a reason: Price, Chose another freelancer, No budget, No response, or Other (with a comment).
- Moving a deal to Won records the close date and offers **Create invoice** with the client and amount pre-filled.
- A closed deal can be reopened into an active stage. The reopening is logged.

### DEAL-5. Deal detail
**As** a freelancer, **I want** to see everything about a deal in one place, **so that** I don't have to switch between sections.

Acceptance criteria:
- Opens in a side sheet over the board and has its own URL.
- Shows the deal fields, linked tasks, invoices and the activity feed. Lets the user add a note.

---

## 6. Tasks

### TASK-1. Create a task
**As** a freelancer, **I want** to create tasks, **so that** I don't forget things.

Acceptance criteria:
- Fields: name (required), description, due date (date, optional time), priority (Low / Medium / High), link to a client and/or a deal.
- Quick add: an input at the top of the list. Pressing Enter creates a task with just a name.
- When created from a client or deal page, the link is filled in automatically.

### TASK-2. Task list
**As** a freelancer, **I want** tasks grouped by due date, **so that** I know what to do today.

Acceptance criteria:
- Groups: Overdue, Today, Tomorrow, This week, Later, No due date.
- Filters: status, priority, client, deal. Overdue tasks are visually highlighted.

### TASK-3. Complete a task
**As** a freelancer, **I want** to mark tasks as done, **so that** I can see my progress.

Acceptance criteria:
- A checkbox moves the task to Done and records the date. A toast with an **Undo** button appears for 5 seconds.
- Done tasks are hidden by default and can be shown with a filter.
- Completing a task is logged in the activity feed of the linked client or deal.

### TASK-4. Urgent indicator
**As** a freelancer, **I want** to see how many tasks are overdue or due today, **so that** nothing slips.

Acceptance criteria:
- The Tasks item in the navigation shows a badge with the number of Overdue + Today tasks.
- The count updates after any task change, without a reload.

---

## 7. Invoices

### INV-1. Create an invoice
**As** a freelancer, **I want** to invoice a client, **so that** I get paid.

Acceptance criteria:
- Fields: client (required), deal (optional), issue date, due date (defaults to +14 days), line items, note.
- Line item: description, quantity, unit price.
- Tax: if the "VAT payer" flag in the profile is off (the default, typical for a FOP on the simplified single-tax regime), no VAT is charged and the invoice shows "VAT not applicable". If the flag is on, the invoice lets the user choose a VAT rate: 20%, 7% or 0%.
- Automatic calculation: line totals, subtotal, VAT, total. Rounded to 2 decimal places using half-up rounding.
- The number is generated in the database and is unique within the account: `INV-2026-0001`. Numbering restarts each year.
- A new invoice starts in Draft status.

### INV-2. Invoice statuses
**As** a freelancer, **I want** to see the status of each invoice, **so that** I can track payments.

Acceptance criteria:
- Statuses: Draft → Sent → Partially paid / Paid. Overdue is computed (the due date has passed and the invoice is not fully paid). Void (cancelled).
- Moving Draft → Sent uses a **Mark as sent** button.
- Line items can only be edited in Draft. A Sent or later invoice can only be voided.
- Every status change is logged.

### INV-3. Record a payment
**As** a freelancer, **I want** to record incoming payments, **so that** I can see the outstanding balance.

Acceptance criteria:
- Payment fields: amount, date, method (Bank transfer, Upwork, Payoneer, Wise, Other), comment. An invoice can have several payments.
- The total of payments cannot exceed the invoice total. This is checked in both the form and the database.
- Status changes to Paid or Partially paid automatically, and the remaining balance is shown. Deleting a payment recalculates the status.

### INV-4. Invoice PDF
**As** a freelancer, **I want** to download an invoice as a PDF, **so that** I can send it to the client.

Acceptance criteria:
- The English PDF includes: logo and seller details from the profile (including IBAN and tax ID), client details, number and dates, line items, totals, VAT or "VAT not applicable", due date, and the note.
- A **Copy email text** button copies a ready-made email to the client to the clipboard (number, amount, due date). The app does not send the email.
- If the business details in the profile are empty, a warning with a link to the profile is shown before download.

### INV-5. Invoice list
**As** a freelancer, **I want** to see all invoices with filters, **so that** I can find unpaid ones.

Acceptance criteria:
- Columns: number, client, date, due date, total, paid, balance, status.
- Filters: status, client, period. Totals for the filtered list are shown at the bottom.

---

## 8. Activity

### ACT-1. Automatic feed
**As** a freelancer, **I want** to see a history of changes, **so that** I remember the context for each client.

Acceptance criteria:
- Logged events: create / update / archive of clients and deals, deal stage changes, creating and completing tasks, invoice status changes, payments.
- Each event has a time, a type, a linked object, and a description of the change (for fields: old value → new value).
- Events are written by database triggers.
- A client's feed includes events for the client and all of their deals, tasks and invoices.
- Automatic events cannot be edited or deleted.

### ACT-2. Manual notes
**As** a freelancer, **I want** to record a call, meeting or message manually, **so that** I can keep track of agreements.

Acceptance criteria:
- Types: Call, Meeting, Message, Note. Fields: type, date and time, text, client (required), deal (optional).
- Manual entries can be edited and deleted.

### ACT-3. Overall feed
**As** a freelancer, **I want** to see a combined feed of recent actions, **so that** I can quickly recall what happened.

Acceptance criteria:
- An Activity page showing all events in chronological order, with filters for type and period.
- Infinite scroll, loading 50 events at a time.

---

## 9. Dashboard

### DASH-1. Key metrics
**As** a freelancer, **I want** to see the key numbers on the home page, **so that** I can judge the state of my business in seconds.

Acceptance criteria:
- KPI cards for the selected period (defaults to the current month), each with the change compared to the previous period:
  - Revenue (sum of payments in the period);
  - Outstanding (sum of unpaid invoices), of which Overdue;
  - Open pipeline (count and total of open deals);
  - Win rate (Won / (Won + Lost) in the period);
  - Average deal size (average amount of won deals).
- Periods: This month, Last month, This quarter, This year, Custom range.
- The numbers match the totals on the list pages when the same filters are applied (covered by tests).

### DASH-2. Charts
**As** a freelancer, **I want** to see trends, **so that** I can spot patterns.

Acceptance criteria:
- Revenue by month: a bar chart for the last 12 months.
- Pipeline by stage: count and total of deals in each open stage.
- Revenue by source (Upwork, Referral, Direct, Other) for the period.
- Charts render correctly in the light theme and at 375px wide.

### DASH-3. Today
**As** a freelancer, **I want** to see urgent items on the home page, **so that** I can start working right away.

Acceptance criteria:
- A **My tasks** block: overdue and due-today tasks, with the option to mark them done right there.
- A **Needs attention** block: overdue invoices and deals whose expected close date has passed.
- Each item links to its detail page.

---

## 10. Out of scope

Not part of this project:
- Teams, invitations, roles and access permissions. Each account has one user.
- Sending emails from the app (invoices, reminders, digests). The exception is Supabase Auth system emails.
- Online invoice payments, bank integrations (Monobank, PrivatBank), the Upwork API, Payoneer, Wise.
- Multi-currency within an account, and exchange rates.
- FOP tax reporting, single-tax and ESV accounting, acts of completed work, electronic signatures, DPS (tax authority) integration.
- Recurring invoices and tasks, estimates and proposals.
- Multiple pipelines, configurable stages, custom fields.
- Integrations with email, calendars or messengers.
- CSV import.
- Push or email notifications and time-based reminders.
- File uploads and attachments (except the logo in the profile).
- OAuth/SSO and two-factor authentication.
- Localization (English only) and a dark theme.
- A mobile app, offline mode, a public API and webhooks.

---

## 11. Non-functional requirements
- **Performance:** first load LCP under 2.5 s on Vercel. Main pages with demo data respond in under 1 s. Routes are split into lazy-loaded chunks.
- **Security:** RLS is enabled on all tables. Tests confirm that a user cannot read or change another user's data. The `service_role` key never ends up in the client bundle.
- **Quality:** strict TypeScript. Unit test coverage of business logic (invoice calculation, statuses, task grouping, dashboard metrics) is at least 80%. Playwright end-to-end scenario: demo login → create client → deal → move to Won → invoice → payment → check the dashboard.
- **Accessibility:** keyboard navigation, visible focus, WCAG AA contrast.
- **Browsers:** the last two versions of Chrome, Safari, Firefox and Edge.
- **Portfolio:** a README with a description, screenshots, a link to the demo, the FSD architecture diagram, and local setup instructions.
