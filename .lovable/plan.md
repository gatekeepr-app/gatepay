# Gatekeepr Internal Workspace — Clients, Projects, Billing & Invoices

Turn the existing `/admin` area into a small internal CRM. Anyone invited by the super admin (`product.gatekeepr@gmail.com`) can sign in, manage clients, spin up projects, configure billing, and generate invoices.

## Roles & access

- **super_admin** — `product.gatekeepr@gmail.com`. Can invite users, assign/revoke roles, see everything.
- **admin** — Full CRUD on clients, projects, invoices.
- **member** — Can create/edit clients & projects they own; sees projects they created or are assigned to.

Roles stored in existing `user_roles` table (extend `app_role` enum with `super_admin`, `member`).

Invite flow: super admin enters email → record in `invitations` table → email magic link via Supabase auth → on first sign-in a trigger reads pending invite and assigns the role.

## Data model (new tables)

- **clients** — `id, name, email, business_name, brand_name, phone, social_links (jsonb: instagram/linkedin/x/website), notes, created_by, created_at`
- **projects** — `id, project_code (human ID like GK-2026-001), name, description, client_id, created_by, status (draft/active/paused/completed), tags (text[]), created_at`
- **project_assignments** — `project_id, user_id` (many-to-many, who works on it)
- **project_billing** — `project_id (PK), billing_type (monthly | yearly | per_project), amount, currency (default BDT), months_count (for monthly), start_date, end_date, total_calculated, payment_terms, notes`
- **invoices** — `id, invoice_number (auto INV-YYYY-####), project_id, client_id, issue_date, due_date, status (draft/sent/paid/overdue), subtotal, tax_rate, tax_amount, total, notes, pdf_url`
- **invoice_line_items** — `id, invoice_id, description, quantity, unit_price, amount`
- **invitations** — `id, email, role, invited_by, token, status (pending/accepted/expired), expires_at, created_at`

All tables: RLS on. Helper SQL function `has_any_role()` + reuse `has_role()`. Super admin bypasses via policy.

### Billing math

- `monthly` → `total = amount × months_count`
- `yearly` → `total = amount × years` (computed from start/end)
- `per_project` → `total = amount`

Stored in `project_billing.total_calculated` and surfaced on project dashboard. "Generate Invoice" prefills from this.

## Routes (under existing `_admin` guard)

```
/admin                          → dashboard (counts, recent activity, quick actions)
/admin/clients                  → list + search + "Add client"
/admin/clients/$clientId        → client profile + their projects
/admin/projects                 → list (filter by status, owner, client, tag)
/admin/projects/new             → wizard: 1) basics  2) client  3) billing  4) review
/admin/projects/$projectId      → project dashboard
/admin/projects/$projectId/billing  → billing setup page
/admin/projects/$projectId/invoices → invoice list + "Generate invoice"
/admin/invoices/$invoiceId      → invoice detail + PDF download
/admin/leads                    → existing leads inbox (unchanged)
/admin/users                    → super_admin only: invite, assign roles, revoke
/invite/$token                  → public route to accept invitation (signs up, links role)
```

Header for `/admin/*` gets a sidebar/topnav with: Dashboard · Clients · Projects · Invoices · Leads · (Users — super admin only) · Logout.

## Project dashboard (`/admin/projects/$projectId`)

- Header: project code, name, status badge, client link, tags, created by
- Tabs/sections: **Overview**, **Billing**, **Invoices**, **Team** (assigned users)
- Quick actions: Edit, Generate Invoice, Mark complete
- Billing card shows type, amount, computed total, next-due hint for monthly

## Invoice generation

- "Generate Invoice" opens a form prefilled from `project_billing` (line item: project name + period)
- Editable line items, tax %, due date, notes
- On save: assign next invoice number (per-year sequence via Postgres function), persist
- "Download PDF" → server function renders HTML → PDF (using a Worker-compatible lib like `pdf-lib` or HTML-to-PDF via headless service; fallback: print-styled HTML page that user prints to PDF)
- Status transitions: draft → sent → paid / overdue (manual)

## Validation & security

- Zod schemas for all forms (name/email/amount limits)
- RLS: members see own + assigned; admins/super_admin see all; only super_admin writes to `user_roles` and `invitations`
- Invitation tokens hashed, 7-day expiry
- All mutations via Supabase client (RLS enforced); invoice number generation via Postgres function to avoid races

## Build order

1. **Schema migration** — extend `app_role`, create all tables, RLS, helper functions, invoice number sequence, trigger to grant role on invite acceptance.
2. **Admin shell** — sidebar layout for `_admin`, dashboard skeleton.
3. **Clients** — list, create/edit, detail page.
4. **Projects** — list, new-project wizard (with billing step), detail page.
5. **Billing page** — dedicated setup with live total calculation.
6. **Invoices** — generate, list, detail, PDF (HTML print view first, real PDF as follow-up).
7. **Users & invites** — super_admin invite UI, `/invite/$token` acceptance route.
8. **Polish** — search, filters, empty states, toasts, breadcrumbs.

## Open questions (will ask before building if you confirm the plan)

1. Currency — BDT only, or multi-currency?
2. PDF invoices — OK to start with a styled print-to-PDF page and add true server-rendered PDF later?
3. Should `member` role see all clients/projects or only their own + assigned?
4. For monthly billing, do you want auto-generated recurring invoices (cron) or manual "generate this month's invoice" button?

Approve and I'll start with the schema migration and admin shell.