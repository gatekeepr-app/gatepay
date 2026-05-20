## Goal

Let external sites (e.g. Nerdi) push transactions into Gatekeepr via API as "unverified", then let an admin click **Verify** to batch all unverified transactions for a given business and POST them back to that site for confirmation. The site then calls our existing `/api/public/transactions/verify` per ref to flip each one to verified.

## 1. Schema change

Migration on `api_keys`:

- Add `callback_url text` — the URL we POST verify batches to for this key's website.
- Add `business_name text` — default business label stamped on inbound transactions when the body doesn't override it. Used as the grouping key.

No new tables. Existing `transactions` already has `verified_at`, `verified_external_name`, `verified_external_user_id`, `verified_source` — we'll reuse them.

## 2. New inbound endpoint — `POST /api/public/transactions/submit`

External site posts a transaction; we store it as unverified.

**Auth**: `Authorization: Bearer <api_key>` (same scheme as `/verify`).

**Body** (proposed, JSON):

```json
{
  "transaction_ref": "TRWQREWF126",     // required, unique-ish ref from their side
  "amount": 18000,                       // required, number
  "currency": "BDT",                     // optional, defaults to "BDT"
  "occurred_at": "2026-05-20T15:50:00Z", // optional, defaults to now()
  "method": "bkash",                     // optional
  "business_name": "Nardi",              // optional, falls back to api_key.business_name
  "external_user_id": "user_42",         // optional, who paid on their side
  "source": "nardi-checkout",            // optional, free-form tag
  "notes": "Order #1234"                 // optional
}
```

**Behavior**:

- Validate with zod (lengths, types).
- Rate-limit per IP (reuse pattern in `transactions.verify.ts`).
- Insert into `transactions` with `verified_at = NULL`, `project_id = NULL`, `client_id = NULL`, `created_by = api_key.created_by`, `verified_external_name = business_name`, `verified_external_user_id`, `verified_source`. **Do NOT stamp `verified_at`.**
- Reject duplicates: if a row with the same `transaction_ref` (case-insensitive) already exists, return `409 { error: "duplicate_ref" }`.
- Stamp `api_keys.last_used_at`.
- Return `201 { received: true, id, transaction_ref }`.
- Standard CORS + OPTIONS handler.

## 3. Verify-batch button on the Transactions page

In `src/routes/_admin.admin.transactions.index.tsx`, beside the existing "New transaction" button, add a **Trigger verify** button.

Click flow:

1. Fetch all `transactions` where `verified_at IS NULL` AND `verified_external_name IS NOT NULL` (inbound, not yet verified).
2. Group them by `verified_external_name` (= business_name).
3. For each group: find the `api_keys` row whose `business_name` matches and has a non-null `callback_url`. If none, skip and warn in the toast.
4. POST to that `callback_url`:
  ```json
   {
     "business_name": "Nerdi",
     "transactions": [
       { "transaction_ref": "...", "amount": 18000, "currency": "BDT", "occurred_at": "..." },
       ...
     ]
   }
  ```
   with header `X-Gatekeepr-Signature: sha256=<hmac>` where the HMAC uses a per-key signing secret (we'll generate it at api_key creation and surface it once, reusing the existing key flow — see open question below) OR no signature for v1 if user prefers (see Q1).
5. We do NOT stamp `verified_at` ourselves — the external site responds, then calls back our existing `POST /api/public/transactions/verify` with each ref. That endpoint already flips `verified_at`.
6. Show toast: "Sent N transactions to M businesses for verification".

This work happens through a `createServerFn` (`triggerVerifyBatch`) protected by `requireSupabaseAuth` so we don't expose `callback_url` or signing secrets to the browser.

## 4. Admin UI tweaks

- `src/routes/_admin.admin.api-keys.tsx`: add `business_name` and `callback_url` inputs to the create form and show them in the list (callback URL truncated). Allow inline edit of `callback_url` (optional polish — can be a follow-up).
- Transactions list: add a small "Unverified" badge for rows with `verified_at IS NULL AND verified_external_name IS NOT NULL` so admins can see the inbound queue.

## 5. Docs page update

Update `src/routes/docs.payments-api.tsx` (and `src/routes/_admin.admin.api-docs.tsx` if used) with:

- The new `POST /submit` endpoint: auth, body schema, sample curl, response codes.
- The existing `POST /verify` endpoint (already documented — leave intact).
- A section "Receiving verify callbacks": what we POST to their `callback_url`, the signature header, and the expected behavior (loop the list and call `/verify` per ref).

## 6. Integration prompt for the Nardi-side dev

At the end of the chat reply I'll provide a ready-to-paste prompt their developer/AI can use to wire up:

- their outbound call to `POST /api/public/transactions/submit` when an order is placed,
- a public endpoint on their side at `callback_url` that receives the batch and loops `POST /api/public/transactions/verify` per ref.

## Open question (one)

**Signing the outbound batch**: Do you want us to HMAC-sign the batch payload with a per-key secret (more secure, slightly more work on Nardi's side), or skip signing in v1 and rely on Bearer-only auth on the callback URL (simpler)? I'll default to **HMAC with a per-key `signing_secret` column on `api_keys**` unless you say otherwise — it's a small addition and avoids a security-debt round-trip later.

## Files touched

- migration: `api_keys` + (likely) `signing_secret`
- new: `src/routes/api/public/transactions.submit.ts`
- new: `src/lib/transactions.functions.ts` (`triggerVerifyBatch` serverFn)
- edited: `src/routes/_admin.admin.transactions.index.tsx` (Trigger verify button + badge)
- edited: `src/routes/_admin.admin.api-keys.tsx` (callback_url + business_name + signing_secret reveal)
- edited: `src/routes/docs.payments-api.tsx` (new sections)