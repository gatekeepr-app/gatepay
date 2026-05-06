# Transactions Module Plan

Add a new "Transactions" area to the admin workspace for recording incoming payments, plus a public API that external apps/websites can call to verify a transaction by ID. Use an external supabase database. I will provide the credentials

## 1. Database

New table `public.transactions`:


| column                    | type                               | notes                                          |
| ------------------------- | ---------------------------------- | ---------------------------------------------- |
| id                        | uuid PK                            | default gen_random_uuid()                      |
| transaction_ref           | text NOT NULL                      | the external transaction ID (bKash/bank/etc.)  |
| amount                    | numeric(14,2) NOT NULL             | amount we received (incoming only)             |
| currency                  | text NOT NULL default 'BDT'        | &nbsp;                                         |
| occurred_at               | timestamptz NOT NULL default now() | editable date/time                             |
| method                    | text NULL                          | optional: bkash, bank, card, other             |
| client_id                 | uuid NULL                          | optional link to a client                      |
| project_id                | uuid NULL                          | optional link to a project                     |
| invoice_id                | uuid NULL                          | optional link to an invoice                    |
| verified_external_name    | text NULL                          | business/app name set by the public API caller |
| verified_external_user_id | text NULL                          | the calling app's user/customer id             |
| verified_source           | text NULL                          | which external app/site verified               |
| verified_at               | timestamptz NULL                   | when public API matched it                     |
| notes                     | text NULL                          | &nbsp;                                         |
| created_by                | uuid NOT NULL                      | admin who entered it                           |
| created_at, updated_at    | timestamptz                        | &nbsp;                                         |


Indexes:

- unique `(lower(transaction_ref))` to prevent duplicates and make lookups fast.
- index on `occurred_at`, `client_id`, `project_id`.

RLS:

- `members read transactions` — `is_workspace_member(auth.uid())`
- `members insert transactions` — `is_workspace_member(...) AND created_by = auth.uid()`
- `owner or manager update/delete transactions` — same pattern as other tables.

Trigger: `touch_updated_at` on update.

Also: add a `last_transaction_ref` and `last_payment_at` column on `projects` (nullable) so the verification API can stamp the project quickly. (Alternative is a join — keeping a denormalized field for cheap dashboard reads.)

## 2. Admin UI

New routes:

- `/_admin/admin/transactions` (index) — list with columns: Date, Ref, Amount, Method, Client/Project, Verified by, Actions. Filters: date range, method, verified/unverified, search by ref.
- `/_admin/admin/transactions/new` — minimal form: amount, currency, transaction_ref, date/time (defaults to now, editable), optional method, optional client/project/invoice picker, optional notes. Single page, no wizard. Uses the same stable `useState` flat form pattern we fixed in clients/new to avoid the input lag bug.
- `/_admin/admin/transactions/$id` — detail view: all fields, verification info (who matched it via API and when), edit & delete (manager/owner only).

Sidebar: add a "Transactions" item between Invoices and Leads with a `Receipt`/`Wallet` icon.

Dashboard: add a "Money received" tile (sum of `amount` this month) next to existing stats.

## 3. Public verification API

New server route: `src/routes/api/public/transactions.verify.ts`

Methods:

- `OPTIONS` — CORS preflight.
- `POST` — verify a transaction.

Request body (JSON):

```
{
  "transaction_ref": "TX123ABC",     // required
  "date": "2026-05-06",              // optional (YYYY-MM-DD or ISO); if present must match occurred_at's date
  "amount": 1500.00,                 // optional; if present must match
  "business_name": "Nerdy",          // required — caller identifies itself
  "external_user_id": "user_42",     // optional — caller's user id
  "source": "nerdy.app"              // optional — domain/app id
}
```

Response:

- `200 { "verified": true, "transaction": { ref, amount, currency, occurred_at, project_code? } }` when found and (if provided) date/amount match.
- `200 { "verified": false, "reason": "not_found" | "date_mismatch" | "amount_mismatch" }` otherwise.
- `400` for invalid body, `429` for rate limit.

Side effects on success:

- Set `verified_external_name`, `verified_external_user_id`, `verified_source`, `verified_at = now()` on the matched transaction (only if not already verified, or append to a small history — see "Decision needed" below).
- If the transaction is linked to a project, update `projects.last_transaction_ref` and `last_payment_at`.

Implementation:

- Uses `supabaseAdmin` (server-only, bypasses RLS) inside the verified handler.
- Validates body with Zod (string lengths, number ranges, ISO date).
- CORS headers on every response (including errors), per server-route CORS guidance.
- Lookup: `select ... from transactions where lower(transaction_ref) = lower($1) limit 1`.
- Lightweight in-memory rate limit by IP (best-effort) to slow brute-forcing of refs.

Auth model for the public API: open POST, no API key required (per request). Security relies on:

- Transaction refs being non-guessable (we don't generate them — they're bank/bKash IDs).
- Caller must supply `business_name` to record who claimed verification.
- Optional date/amount checks reduce false positives.

If you later want stricter security we can add per-caller API keys; flagged in "Decision needed".

A second `GET /api/public/transactions.verify?ref=...&date=...` is **not** added — POST keeps the body structured and avoids logs leaking refs in URLs.

## 4. Files to add / edit

Add:

- `supabase/migrations/<ts>_transactions.sql` — table, indexes, RLS, trigger, projects columns.
- `src/routes/_admin.admin.transactions.index.tsx`
- `src/routes/_admin.admin.transactions.new.tsx`
- `src/routes/_admin.admin.transactions.$id.tsx`
- `src/routes/api/public/transactions.verify.ts`
- `src/lib/admin/transactions.ts` — small helpers (zod schemas, fetchers).

Edit:

- `src/components/admin/Sidebar.tsx` — add Transactions link.
- `src/routes/_admin.admin.index.tsx` — add "Money received" stat tile.

## 5. Decision needed (please confirm before build)

1. **Multiple verifications per transaction**: should the same transaction_ref be verifiable by only one external caller (first-wins, lock after) OR allow multiple verifications (we'd add a `transaction_verifications` child table to keep history)?
2. **API auth**: open endpoint as described, OR require each external app to register and send an `x-api-key` header (means adding an `api_clients` table + key management UI under Super Admin)?
3. **Strict matching**: if `amount` is provided in the API call and doesn't match, return `verified: false` — confirm that's the desired behavior (vs. ignoring amount and only using ref+date).

Defaults if you don't answer: (1) allow multiple, append history; (2) open endpoint with business_name required; (3) strict — mismatched amount returns false.