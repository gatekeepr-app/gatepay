# Untangle codebase decision log

Read-only audit before refactoring. Existing user edits in `Context/`, invoice list/detail presentation, `app/globals.css`, and the home page are preserved.

## Problems found

- The versioned public API transaction routes repeat request IDs, IP hashing, rate limiting, body size and JSON parsing, response bookkeeping, error conversion, and request logging. Route-specific schema and Convex operation are mixed into this lifecycle.
- API request schemas live in route handlers while OpenAPI field constraints are separately handwritten. Those contracts can drift.
- `json()` always returns the first configured CORS origin; route responses don't consistently use the request-aware CORS helper. `jsonFromRequest`, `jsonOk`, `jsonError`, and `checkCsrf` have no callers; route code repeats the body-size literal.
- Unversioned `/api/public/transactions/*` endpoints are compatibility redirects to v1. They should remain explicit aliases; they are externally observable API behavior.
- Admin authentication is checked in `app/admin/layout.tsx`, then fetched a second time by `UserProvider`. Pages and shared admin components independently reread the storage token, including during mutation handlers.
- Invoice list, detail, and document preview duplicate formatting that belongs in `src/lib/admin/format.ts`.
- `convex/lib/invoiceReference.ts` and `convex/brand.ts` separately define reference defaults/token vocabulary and validation/rendering rules.
- `convex/lib/helpers.ts` combines project/pay-code generation, billing math, shared validators, text/HTML handling, and audit logging even though those concerns change independently.
- Invoice and invitation mutations accept free-form status/role strings and cast them, while shared domain validators already exist.
- Payment email/webhook delivery and transaction state transitions are coupled inside `convex/transactions.ts` and `convex/public.ts`; callback and email templates/policy overlap, and some delivery failures are intentionally swallowed. Preserve their current behavior while making shared notification policy explicit.
- `convex/auth.ts` duplicates account creation and hardcodes the privileged email in both sign-up and authenticate flows. `createSession` takes `any` context and a string ID even though it only serves mutation flows.
- The admin dashboard component set (`stats`, `activity`, `revenue-chart`) is unused by routes. The browser Convex client wrapper is also unreferenced; the provider owns a separate client.
- Root configuration has npm, pnpm, and Bun lock/config files without a clear single package-manager contract. This creates unnecessary install/dependency coupling.
- There are no existing test or spec files in the repository tree. Preserve public Convex functions with no local callers because deployed/external consumers may depend on them.

## Fixes and problems they address

- Introduce one typed request lifecycle for versioned API handlers, with a shared bounded JSON reader, request-aware response construction, and a single logging/finalization path. Keep endpoint schemas, Convex calls, and response mapping in their route modules. This addresses repeated lifecycle code, the duplicated body limit, unused helpers, and inconsistent CORS behavior while retaining intentional fail-open rate limiting and non-fatal logging.
- Put endpoint schemas and API metadata in a shared endpoint contract module; derive the published OpenAPI document from those contracts. Keep legacy paths as thin, explicit compatibility aliases.
- Make the admin layout the sole owner of session lookup and expose its resolved user/token through the existing admin context. Remove the duplicate `getMe` call and replace scattered storage reads with the context contract.
- Extend shared date/money formatting to cover invoice timestamps and use it in the list, detail, and print preview.
- Make invoice-reference defaults, token vocabulary, validation, and rendering one policy in `convex/lib/invoiceReference.ts`; have brand settings and invoice creation depend on that policy.
- Split `convex/lib/helpers.ts` into cohesive project codes, billing calculations, validators, text/HTML utilities, and admin audit logging; update imports without changing the exported Convex API.
- Use domain validators at invoice and invitation mutation boundaries; remove unchecked string casts.
- Extract notification content/policy and transport helpers from transaction/public mutation modules without changing delivery timing, retry delays, fail-open behavior, or public function references. Keep any special failure behavior that reflects an operational requirement.
- Centralize privileged-account identity and type the session helper against `MutationCtx`. Preserve registration/authenticate semantics.
- Remove only locally unused, non-public dashboard components and the unreferenced browser client wrapper. Retain unused public Convex functions pending external-consumer evidence.
- Use npm as the package manager named by the maintained setup instructions and `start-dev.bat`; remove the inherited pnpm/Bun lock/config files so dependency updates have one lockfile to maintain.
- Remove comments that merely restate implementation as selected. No existing tests/specs were found to clean up; verify the build and structural behavior after the refactor.
