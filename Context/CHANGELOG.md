# Changelog

## 2.5.0 (2026-05-31)

### Added
- **Admin activity log**: New `adminLogs` table tracks all admin actions — user management, API key operations, transaction status changes, reimbursement, refunds, and CRUD on clients/projects/invoices
- **Activity log viewer**: `/admin/activity-log` page with sidebar link; shows human-readable action labels, details, timestamp, and admin email
- **Invitation emails**: When an admin invites a user, an email is now sent via Resend with the invite link (`/invite/{token}`)
- **bKash payment image**: `bkash-payment.jpg` displayed on the pay portal page above the bKash number card
- **Delete redirect**: Transaction delete now redirects back to `/admin/transactions`
- **User removal UI**: Remove button on each user row in `/admin/users`

### Security
- **`revealKey` query fixed**: Changed arg type from `v.string()` to `v.id("apiKeys")`, proper null check for missing signing secrets
- **`requireAdmin` enforced**: 30+ Convex queries/mutations now require session token + admin role
- **HTML escaping**: `escapeHtml()` applied to all user-supplied values in Resend email templates
- **Open redirect fixed**: `/login` validates redirect with `/^\/(?!\/)/`
- **API keys enhanced**: Signing secret auto-generated on create; `revealKey` query allows re-viewing key + signing secret

### Changed
- **Convex functions deployed**: All changes pushed to `moonlit-zebra-733.convex.cloud`
- **Sidebar**: Activity Log link added; Leads link removed

### Removed
- **Leads page**: `/admin/leads` deleted along with leads card from dashboard

## 2.4.0 (2026-05-30)

### Added
- **Refund system**: Initiate refunds through payment gateways (SSLCommerz sandbox + production)
- **Refund tracking**: `refunds` table with status (pending/processing/completed/failed/cancelled), gateway reference, and response
- **Refund UI**: Transaction detail page shows refund history and "Initiate Refund" button
- **Gateway integration**: SSLCommerz refund API integration (sandbox simulation + production endpoint)
- **Refund status history**: Every refund action logged in status history
- **PRD**: Product requirements document covering current features, shortcomings, and gateway integration benefits

### Security
- **Reverted CORS relaxation**: API locked back to `pay.darvizlabs.com` origin only
- **Reverted CSRF relaxation**: Origin validation restored
- **Widget removed**: Dropped for now due to API key exposure risk — requires server-side proxy for secure integration

## 2.3.0 (2026-05-29)

### Added
- **Refund system**: Initiate refunds through payment gateways (SSLCommerz sandbox + production)
- **Refund tracking**: `refunds` table with status (pending/processing/completed/failed/cancelled), gateway reference, and response
- **Refund UI**: Transaction detail page shows refund history and "Initiate Refund" button
- **Gateway integration**: SSLCommerz refund API integration (sandbox simulation + production endpoint)
- **Refund status history**: Every refund action logged in status history
- **PRD**: Product requirements document covering current features, shortcomings, and gateway integration benefits

### Security
- **Reverted CORS relaxation**: API locked back to `pay.darvizlabs.com` origin only
- **Reverted CSRF relaxation**: Origin validation restored
- **Widget removed**: Dropped for now due to API key exposure risk — requires server-side proxy for secure integration

### Added
- **Transaction status lifecycle**: Pending → Verified → Reimbursed / Failed, with DB-backed status history
- **Reimbursement flow**: Track amount, method, external reference when paying clients back
- **Status filter tabs**: Filter transactions by status with count badges on admin list
- **Batch status change**: Select multiple transactions and change status in bulk
- **Reimbursement form**: Admin can reimburse verified payments with amount, method, and reference
- **Status history timeline**: Every status change logged with timestamp, who changed it, and notes
- **Admin email notifications**: New transaction received → email sent to all admins
- **Backfill mutation**: One-time migration to set status on V1 transactions without status field

### Fixed
- **Critical performance**: `getByStatus` now uses `by_status` index instead of full table scan
- **Critical performance**: `getStatusCounts` uses bounded index queries instead of loading all rows
- **Critical performance**: `backfillStatus` batched with `take(100)` instead of unbounded `collect()`
- **Pagination**: All list queries limited to 100 records with `.take(100)`
- **Analytics**: Log query limited to 500 entries
- **Code generation**: DB-backed counters replace in-memory sequences (prevents collisions on restart)
- **Schema**: Added `counters` table, `leads` table indexes (`by_status`, `by_created_at`)
- **Backward compatibility**: `status` field is optional — V1 transactions without status default to "pending"
- **Email logging**: Resend API errors now logged to console instead of silently failing

### Changed
- **Callback payload**: Added `event` field ("verified" | "reimbursed") for backward-compatible partner notifications
- **Callback payload**: Added `status` field per transaction in callback
- **Performance audit**: Fixed 31 issues across 10 Convex files

## 2.1.0 (2026-05-28)

### Added
- **Payment confirmation emails**: Resend integration sends confirmation email to client after admin verifies payment
- **Client editing**: Edit dialog on client detail page with all fields
- **Transaction detail page**: Full details with receiving data, payer name, period, verification info
- **Dashboard updates**: Revenue stats, unverified transaction count, recent transactions/leads lists
- **Invoice form labels**: All fields on invoice/new page now have proper labels
- **API docs redirect**: `/admin/api-docs` redirects to `/docs/payments-api`

### Changed
- **Homepage redesigned**: Pixel Perfect Landing structure with GatePay branding
- **Homepage mobile responsive**: Hamburger menu, responsive headings, scaled sections
- **Sidebar mobile responsive**: Hamburger drawer with overlay, auto-closes on navigation

### Removed
- Old TanStack Router routes (`src/routes/`)
- Vite-era `src/styles.css`
- 39 unused shadcn UI components
- 26 unused npm packages (Radix UI, recharts, embla, vaul, etc.)

## 2.0.0 (2026-05-28)

### Major Changes
- **Full stack migration**: TanStack Router + Vite + Supabase → Next.js 16 App Router + Turbopack + Convex
- **GatePay branding**: All UI, API headers (`X-GatePay-Signature`), and docs use GatePay name
- **New admin panel**: 16+ pages migrated to `app/admin/` with auth guard and sidebar
- **Client payment portal**: `/pay/:code` with bKash instructions, auto-invoice generation
- **Public API**: Versioned under `/api/v1/public/` with rate limiting, logging, and OpenAPI spec

### Removed
- TanStack Router, Vite 7, Supabase, Cloudflare, Bun runtime

## 1.x (Previous)

Prior releases used TanStack Start + Vite + Supabase + Cloudflare.
