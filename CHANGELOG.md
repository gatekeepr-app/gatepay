# Changelog

## 2.0.0 (2026-05-28)

### Major Changes
- **Full stack migration**: TanStack Router + Vite + Supabase → Next.js 15 App Router + Convex
- **New admin panel**: 16+ pages migrated to `app/admin/` with auth guard and sidebar
- **Client payment portal**: `/pay/:code` with bKash instructions, two-column layout, auto-invoice generation
- **Public API**: Versioned under `/api/v1/public/` with rate limiting, logging, and OpenAPI spec
- **Auto-invoicing**: `submitPayMutation` creates a transaction + invoice atomically when a client pays

### What's New
- Pay code entry page (`/pay`) and payment form (`/pay/[code]`)
- Admin: projects, clients, invoices, transactions, users, API keys, leads, analytics
- Invite flow: `/invite/:token` for team invitations
- Health check endpoint: `GET /api/v1/public/health`
- OpenAPI spec endpoint: `GET /api/v1/public/openapi`
- DB-based sessions (replaced in-memory Map)
- DB-based rate limiting (replaced in-memory burst)
- `createdBy`/`invitedBy` made optional in all Convex mutations to fix admin page validation errors

### Removed
- TanStack Router (file-based routing in `src/routes/`)
- Vite 7 build system
- Supabase (all integrations, migrations, and config)
- Cloudflare deployment config
- In-memory session store
- Bun runtime config (`bun.lock`)

## 1.x (Previous)

Prior releases used TanStack Start + Vite + Supabase + Cloudflare.
