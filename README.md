# Gatekeepr

Full-stack business management platform with a public marketing site, admin workspace (CRM, projects, billing, invoicing, transactions), client payment portal, and a partner-facing payment verification API.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript |
| Framework | Next.js 15 (App Router) |
| Backend | Convex (schema, auth, mutations, queries, HTTP actions) |
| Styling | Tailwind CSS v4 + shadcn/ui (new-york) |
| Icons | Lucide React |
| Validation | Zod |
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
└── page.tsx            # Marketing homepage

convex/                 # Convex backend
├── schema.ts           # 11 tables (users, clients, projects, billing, invoices, transactions, apiKeys, etc.)
├── auth.ts             # signUp, signIn, getMe
├── transactions.ts     # CRUD + submitPayPayment (auto-generates invoice)
├── invoices.ts         # CRUD + line items
├── projects.ts         # CRUD + pay code lookup
├── billing.ts          # Billing config per project
├── clients.ts, users.ts, api_keys.ts, invitations.ts, leads.ts
├── public.ts           # verifyTransaction + submitTransaction (partner API)
├── rate_limit.ts       # DB-based rate limiter
└── seed.ts             # Initial admin seeding

src/                    # Shared client code
├── components/
│   ├── admin/          # Sidebar
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
- `GET /api/v1/public/health` — Health check
- `GET /api/v1/public/openapi` — OpenAPI spec

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Yes | Convex deployment URL (client-side) |
| `CONVEX_URL` | Yes | Convex deployment URL (server-side) |
