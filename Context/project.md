# GatePay

A full-stack business management platform with a public marketing website and a private admin workspace for CRM, project management, billing, invoicing, payment tracking, refunds, and a partner-facing payment verification API.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Framework | Next.js 16 (App Router + Turbopack) |
| Backend | Convex (schema, auth, mutations, queries, HTTP actions) |
| Styling | Tailwind CSS v4 + shadcn/ui (new-york) |
| Fonts | ClashDisplay (headings) + Inter (body) |
| Icons | Lucide React |
| Validation | Zod |
| Email | Resend |
| Deployment | Vercel (Next.js) + Convex (backend) |

## Project Structure

```
app/                    # Next.js App Router pages
├── admin/              # Admin workspace (16+ pages)
├── api/                # Public API route handlers
├── docs/               # API documentation
├── invite/[token]/     # Team invitation acceptance
├── login/              # Authentication
├── pay/                # Client payment portal
├── layout.tsx          # Root layout (ConvexClientProvider)
└── page.tsx            # Marketing homepage

convex/                 # Convex backend
├── schema.ts           # 16 tables
├── auth.ts             # signUp, signIn, getMe
├── transactions.ts     # CRUD + submitPayPayment (auto-generates invoice)
├── invoices.ts         # CRUD + line items
├── projects.ts         # CRUD + pay code lookup
├── billing.ts          # Billing config per project
├── clients.ts, users.ts, api_keys.ts, invitations.ts
├── refunds.ts          # Refund lifecycle (initiate, update status)
├── public.ts           # verifyTransaction + submitTransaction + triggerVerifyBatch
├── rate_limit.ts       # DB-based rate limiter
├── api_logs.ts         # Public API request logging
├── admin_logs.ts       # Admin activity audit trail
├── seed.ts             # Initial admin seeding

src/                    # Shared client code
├── components/
│   ├── admin/          # Sidebar (mobile responsive with hamburger drawer)
│   ├── site/           # Marketing components
│   └── ui/             # shadcn components
├── integrations/convex/ # Client provider, server client, auth
└── lib/                # Validation, formatting, API helpers
```

## Routes

| Path | Description |
|---|---|
| `/` | Marketing homepage |
| `/login` | Sign in / sign up |
| `/invite/:token` | Accept team invitation |
| `/pay/:code` | Client payment page with bKash |
| `/docs/payments-api` | Public API docs |
| `/admin` | Dashboard, clients, projects, invoices, transactions, users, API keys, activity log, analytics |
| `/api/v1/public/*` | Partner API (verify, submit, review, health, openapi) |

## Public API

- `POST /api/v1/public/transactions/verify` — Verify a transaction (Bearer auth)
- `POST /api/v1/public/transactions/submit` — Submit unverified transaction
- `POST /api/v1/public/transactions/review` — Client review of transaction
- `POST /api/v1/public/transactions/refund` — Request a refund for a verified transaction
- `GET /api/v1/public/health` — Health check
- `GET /api/v1/public/openapi` — OpenAPI spec

## Key Features

- **Transaction status lifecycle**: Pending → Verified → Reimbursed / Failed with full audit trail
- **Auto-invoicing**: `submitPayPayment` creates a transaction + invoice atomically when a client pays
- **Reimbursement tracking**: Track amount, method, external reference when paying clients back
- **Refund system**: Initiate refunds with receiver details, full lifecycle tracking
- **Payment confirmation emails**: Resend integration sends GatePay confirmation to client after status changes
- **Admin notifications**: Email sent to admins when new payment is received
- **Callback system**: Partners receive `event: "verified"` or `event: "reimbursed"` webhooks with HMAC signing
- **Admin activity log**: Full audit trail of all admin actions
- **Invitation emails**: Resend sends invite link when admin invites a user
- **Security hardened**: `requireAdmin` on 30+ functions, HTML escaping, open redirect protection, auto-generated signing secrets
- **Mobile responsive**: Hamburger sidebar, responsive homepage, mobile-friendly admin
- **Performance optimized**: DB-backed counters, bounded queries, indexed lookups, pagination on all lists

## Quick Start

```sh
npm install
npx convex dev          # starts Convex dev deployment (separate terminal)
npm run dev             # starts Next.js on port 8080
```

Set `.env.local`:

```
NEXT_PUBLIC_CONVEX_URL=https://<your-deployment>.convex.cloud
CONVEX_URL=https://<your-deployment>.convex.cloud
RESEND_API_KEY=re_...
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex deployment URL (client-side) |
| `CONVEX_URL` | Yes | Convex deployment URL (server-side) |
| `RESEND_API_KEY` | No | Resend API key for payment confirmation emails |
