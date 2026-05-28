# Gatekeepr

Full-stack business management platform with a public marketing site, admin workspace (CRM, projects, billing, invoicing, transactions), client payment portal, and a partner-facing payment verification API.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Framework | Next.js 15 (App Router) |
| Backend | Convex (schema, auth, mutations, queries, HTTP actions) |
| Styling | Tailwind CSS v4 + shadcn/ui (new-york) |
| Fonts | ClashDisplay (headings) + Inter (body) |
| Icons | Lucide React |
| Validation | Zod |
| Email | Resend |
| Deployment | Vercel (Next.js) + Convex (backend) |

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
└── page.tsx            # Marketing homepage (Pixel Perfect Landing design)

convex/                 # Convex backend
├── schema.ts           # 11 tables
├── auth.ts             # signUp, signIn, getMe
├── transactions.ts     # CRUD + submitPayPayment (auto-generates invoice)
├── invoices.ts         # CRUD + line items
├── projects.ts         # CRUD + pay code lookup
├── billing.ts          # Billing config per project
├── clients.ts, users.ts, api_keys.ts, invitations.ts, leads.ts
├── public.ts           # verifyTransaction + submitTransaction + triggerVerifyBatch (sends confirmation emails)
├── rate_limit.ts       # DB-based rate limiter
└── seed.ts             # Initial admin seeding

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
| `/admin` | Dashboard, clients, projects, invoices, transactions, users, API keys, leads, analytics |
| `/api/v1/public/*` | Partner API (verify, submit, review, health, openapi) |

## Public API

- `POST /api/v1/public/transactions/verify` — Verify a transaction (Bearer auth)
- `POST /api/v1/public/transactions/submit` — Submit unverified transaction
- `POST /api/v1/public/transactions/review` — Client review of transaction
- `GET /api/v1/public/health` — Health check
- `GET /api/v1/public/openapi` — OpenAPI spec

## Key Features

- **Auto-invoicing**: `submitPayPayment` creates a transaction + invoice atomically when a client pays
- **Payment confirmation emails**: Resend integration sends confirmation to client after admin verifies payment
- **Mobile responsive**: Hamburger sidebar, responsive homepage, mobile-friendly admin
- **Client editing**: Full CRUD on clients with edit dialog and linked projects
- **Transaction details**: Receiving data, verification info, linked invoice/project
- **Dashboard**: Revenue stats, unverified count, recent transactions/leads

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex deployment URL (client-side) |
| `CONVEX_URL` | Yes | Convex deployment URL (server-side) |
| `RESEND_API_KEY` | No | Resend API key for payment confirmation emails |
