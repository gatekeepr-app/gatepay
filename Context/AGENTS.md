<!-- convex-ai-start -->

This project uses [Convex](https://convex.dev) as its backend.

When working on Convex code, **always read
`convex/_generated/ai/guidelines.md` first** for important guidelines on
how to correctly use Convex APIs and patterns. The file contains rules that
override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running
`npx convex ai-files install`.

<!-- convex-ai-end -->

## Build Status

- `npm run build` — Next.js build compiles and type-checks successfully.
- `npm run dev` — Starts dev server on port 8080.
- API route health check: `GET /api/v1/public/health` → `{"status":"ok"}`
- Environment variables needed: `NEXT_PUBLIC_CONVEX_URL`, `CONVEX_URL` (both pointing to Convex deployment URL).

## Architecture

- **Frontend**: Next.js 16 (App Router + Turbopack), React 19, Tailwind CSS v4, `convex/react` for client-side data.
- **Backend**: Convex (`convex/` directory) — schema, mutations, queries, HTTP actions. Rate limiting is DB-based (no `setInterval`/`setTimeout`).
- **API Routes**: Next.js Route Handlers in `app/api/v1/public/` — submit, verify, review, refund, health, openapi. All use `ConvexHttpClient` server-side.

## Useful Commands

- `npm run dev` — Next.js dev server on port 8080.
- `npx convex dev` — Syncs Convex functions with dev deployment.
- `npm run build` — Production build.

## Key Files

| File | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with ConvexClientProvider + Toaster |
| `app/globals.css` | Tailwind v4 global styles |
| `app/api/v1/public/*/route.ts` | Public API route handlers |
| `app/docs/payments-api/page.tsx` | Public API docs page |
| `convex/` | Convex backend (schema, mutations, queries, HTTP actions) |
| `convex/schema.ts` | 16 tables (users, clients, projects, billing, invoices, transactions, refunds, apiKeys, adminLogs, etc.) |
| `convex/admin_logs.ts` | Admin activity audit trail |
| `src/integrations/convex/provider.tsx` | ConvexReactClient client wrapper |
| `src/integrations/convex/server.ts` | ConvexHttpClient for server-side |
| `src/lib/api/helpers.ts` | Shared API helpers (CORS, rate limit, logging, etc.) |
| `src/components/admin/Sidebar.tsx` | Admin sidebar (uses next/link + usePathname) |
| `src/components/site/` | Public site components (Header, Hero, Businesses, etc.) |
