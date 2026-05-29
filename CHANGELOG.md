# Changelog

## 2.1.0 (2026-05-28)

### Added
- **Payment confirmation emails**: Resend integration sends confirmation email to client after admin verifies payment
- **Client editing**: Edit dialog on client detail page with all fields (name, email, business, brand, phone, notes)
- **Transaction detail page**: Full details with receiving data, payer name, period, verification info, linked project/invoice
- **Dashboard updates**: Revenue stats, unverified transaction count, recent transactions/leads lists, clickable stat cards
- **Invoice form labels**: All fields on invoice/new page now have proper labels
- **API docs redirect**: `/admin/api-docs` redirects to `/docs/payments-api`

### Changed
- **Homepage redesigned**: Pixel Perfect Landing structure (Hero, About, Features, How It Works, Partners, Testimonial, Footer) with GatePay branding
- **Homepage mobile responsive**: Hamburger menu, responsive headings, scaled sections
- **Sidebar mobile responsive**: Hamburger drawer with overlay, auto-closes on navigation
- **Color system updated**: ClashDisplay font, neon blue primary, ink dark sections

### Removed
- Old TanStack Router routes (`src/routes/`)
- Stale `Pixel Perfect Landing` directory from build (excluded from tsconfig)
- Vite-era `src/styles.css`

## 2.0.0 (2026-05-28)

### Major Changes
- **Full stack migration**: TanStack Router + Vite + Supabase → Next.js 16 App Router + Turbopack + Convex
- **GatePay branding**: All UI, API headers (`X-GatePay-Signature`), and docs use GatePay name
- **New admin panel**: 16+ pages migrated to `app/admin/` with auth guard and sidebar
- **Client payment portal**: `/pay/:code` with bKash instructions, two-column layout, auto-invoice generation
- **Public API**: Versioned under `/api/v1/public/` with rate limiting, logging, and OpenAPI spec
- **Auto-invoicing**: `submitPayMutation` creates a transaction + invoice atomically when a client pays

### Removed
- TanStack Router (file-based routing in `src/routes/`)
- Vite 7 build system
- Supabase (all integrations, migrations, and config)
- Cloudflare deployment config
- In-memory session store
- Bun runtime config (`bun.lock`)

## 1.x (Previous)

Prior releases used TanStack Start + Vite + Supabase + Cloudflare.
