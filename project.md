# Gatekeepr

A full-stack business management platform with a public marketing website and a private admin workspace for CRM, project management, billing, invoicing, payment tracking, and a partner-facing payment verification API.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Bun |
| Frontend | React 19 + TypeScript 5.8 |
| Meta-framework | TanStack Start (SSR/SSG) |
| Routing | TanStack Router (file-based) |
| Data fetching | Convex reactive queries |
| Styling | Tailwind CSS v4 + shadcn/ui (new-york) |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Backend | Convex (schema, auth, mutations, queries) |
| Server functions | TanStack Start `createFileRoute` handlers |
| Deployment | Cloudflare (Workers) |
| Build | Vite 7 |
| Charts | Recharts |

## Project Structure

```
src/
├── assets/           # Static images (13 files)
├── components/
│   ├── admin/        # Admin sidebar
│   ├── site/         # Public marketing components (Hero, Services, Work, etc.)
│   └── ui/           # shadcn/ui components (46 files)
├── hooks/            # use-mobile, use-reveal
├── integrations/
│   └── convex/       # client.ts, server.ts, auth.ts
├── lib/
│   ├── admin/        # Formatting utils
│   ├── validation.ts # Zod schemas
│   └── utils.ts      # cn() helper
├── routes/           # 27 file-based route files
└── styles.css        # Global styles + Tailwind

convex/
├── schema.ts         # Database schema (11 tables)
├── auth.ts           # signUp, signIn, getMe, sessions
├── users.ts          # User CRUD
├── clients.ts        # Client CRUD
├── projects.ts       # Project CRUD + pay code lookup
├── billing.ts        # Billing config per project
├── invoices.ts       # Invoice + line items
├── transactions.ts   # Transaction CRUD + verify
├── api-keys.ts       # API key management
├── invitations.ts    # Team invitations
├── leads.ts          # Contact form submissions
├── rate-limit.ts     # Distributed rate limiter
├── public.ts         # verifyTransaction + submitTransaction
├── seed.ts           # Initial admin seeding
└── lib/helpers.ts    # Shared utilities
```

## Commands

```sh
bun dev          # Start dev server
npx convex dev   # Start Convex dev server (separate terminal)
bun build        # Build for production
bun preview      # Preview production build
bun lint         # ESLint
bun format       # Prettier
```

## Public Routes

| Path | Description |
|---|---|
| `/` | Marketing homepage |
| `/login` | Authentication |
| `/invite/:token` | Accept team invitation |
| `/pay/:code` | Client payment page |
| `/docs/payments-api` | Public API docs |

## Admin Routes (`/_admin`)

| Path | Description |
|---|---|
| Dashboard | Stats overview |
| Clients | List, create, view |
| Projects | List, create (4-step wizard), view, billing |
| Invoices | List, create (line items, tax), view |
| Transactions | List, submit, verify batch, detail |
| Users | Invitations, role management |
| Leads | Contact form submissions |
| API Keys | Create, revoke, view credentials |
| API Docs | Internal API documentation |

## Database Schema (Convex)

### Tables
- **users** — User accounts with role (super_admin, admin, member) and password hash
- **leads** — Contact form submissions
- **clients** — Client records with social links
- **projects** — Project with auto-generated code (GK-YYYY-NNNN), pay_code (6-char)
- **projectBilling** — Monthly/yearly/per_project billing config
- **invoices** — Auto-numbered (INV-YYYY-NNNN)
- **invoiceLineItems** — Line items per invoice
- **invitations** — 7-day expiry tokens
- **transactions** — Payment records with verification workflow
- **apiKeys** — Partner API keys with key_hash, callback_url, signing_secret
- **rateLimits** — Distributed rate limit counters

## Public API

### POST /api/public/transactions/verify
Verifies a transaction. Auth: Bearer token. Returns `{ verified: true, transaction }` or `{ verified: false, reason }`.

### POST /api/public/transactions/submit
Submits an unverified transaction. Auth: Bearer token. Returns 201 with `{ received: true, status: "unverified" }`. Duplicate ref returns 409.

## Payment Verification Flow

1. Partner calls `/transactions/submit` → unverified transaction created
2. Admin selects transactions → clicks "Trigger verify"
3. Server groups by business_name → POSTs to callback_url with HMAC-SHA256
4. Partner returns 2xx → transaction marked verified
