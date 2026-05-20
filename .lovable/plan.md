## Goal

Let admins re-view both the API token and signing secret for any existing API key, via a modal opened from the API Keys table.

## Schema change

Migration on `api_keys`: add `key_token text` to store the full token in plaintext (alongside the existing `key_hash` so `/api/public/*` auth keeps working unchanged).

Existing rows: `key_token` will be `NULL` for keys created before this change — they remain hash-only and the UI will show "Not recoverable (created before plaintext storage)" for the token field. New keys store both.

The existing RLS already restricts `api_keys` reads to workspace managers (`is_workspace_manager(auth.uid())`), so the plaintext column is only visible to admins/managers.

## API Keys page (`src/routes/_admin.admin.api-keys.tsx`)

1. Add `key_token` and `signing_secret` to the `Row` type and the SELECT query.
2. On create, also write the generated `token` into `key_token` (in addition to `key_hash`).
3. Replace the "one-time" inline reveal panel: still show the post-create credentials inline, but the warning copy changes to "Credentials saved — you can re-open them anytime from the table."
4. Add a **View credentials** action (key icon) in each row's Actions cell. Clicking it opens a modal showing:
   - API token (with copy button) — or a muted "Not recoverable for this legacy key" line if `key_token` is null
   - Signing secret (with copy button) — or "Not set" if null
   - A subtle "These values grant full API access — share carefully" note
5. Modal uses the same masking + copy pattern already in the file (reuse `copyTo`).

## Docs page tweak

In `src/routes/docs.payments-api.tsx`, soften the line that says the signing secret is shown only once — replace with "Stored on the key; managers can re-view it anytime from the API Keys page."

## Files touched

- migration: add `key_token` column to `api_keys`
- edited: `src/routes/_admin.admin.api-keys.tsx` (store token, modal reveal, table button)
- edited: `src/routes/docs.payments-api.tsx` (one-line copy fix)

## Security note

You chose to store the API token in plaintext for ops convenience. RLS keeps it readable only to managers, but if the database is ever exfiltrated, those tokens are usable until rotated. Standard practice (Stripe, GitHub) is hash-only — happy to switch back later by dropping `key_token` and re-issuing.
