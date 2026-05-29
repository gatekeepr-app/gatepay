# GatePay — Product Requirements Document

**Version:** 1.0
**Date:** May 29, 2026
**Author:** GatePay Engineering
**Status:** Draft

---

## 1. Executive Summary

GatePay is a payment verification and audit platform that sits between businesses and their payment gateways (SSLCommerz, EPS, bKash, Nagad, etc.). It does not process payments — it **verifies, identifies, and audits** every transaction that flows through a business's payment infrastructure.

When a customer pays via SSLCommerz or EPS, the payment gateway confirms the money moved. But the business still needs to answer: *Who paid? Is this transaction real? Which client does it belong to? Has it been reimbursed?* GatePay answers these questions.

**Core value proposition:** Every successful payment gateway transaction gets a verified client identity, a cryptographic signature check, and a full audit trail — before it enters the business's records.

---

## 2. Problem Statement

### The Gap After Payment Gateways

Payment gateways like SSLCommerz and EPS handle the money movement. They confirm "payment succeeded." But they leave critical gaps:

| What the gateway provides | What the business still needs |
|---------------------------|-------------------------------|
| Transaction ID | Client name and identity |
| Amount and status | Verification that the transaction is legitimate |
| Timestamp | Audit trail of who verified it and when |
| Nothing | Protection against replay attacks and forged callbacks |

### Current Pain Points

1. **No client identity on transactions** — When SSLCommerz sends a callback, the business gets a transaction ID but not which client paid. Manual reconciliation is required.

2. **Callback forgery** — Anyone can POST to a callback URL with a fake payload. Without cryptographic validation, businesses accept fraudulent "payment confirmed" callbacks.

3. **No audit trail** — When was the transaction verified? By whom? Was it reimbursed? There's no history.

4. **Manual reconciliation** — Finance teams manually match gateway transaction IDs to client records, wasting hours.

5. **No reimbursement tracking** — When a payment needs to be returned, there's no system to track it end-to-end.

---

## 3. Current Product Features

### 3.1 Transaction Verification API

Businesses submit transactions to GatePay when payments are made. GatePay stores them and provides verification on demand.

**Endpoints:**
- `POST /api/v1/public/transactions/submit` — Record a new transaction
- `POST /api/v1/public/transactions/verify` — Verify a transaction exists and matches
- `POST /api/v1/public/transactions/review` — Client-side review and annotation

**Authentication:** Bearer token (API key) per business.

### 3.2 Transaction Status Lifecycle

Every transaction follows a defined lifecycle:

```
Pending → Verified → Reimbursed (terminal)
Pending → Failed → Pending (re-openable)
```

- **Pending:** Transaction submitted, awaiting verification
- **Verified:** Confirmed by admin or callback — fires webhook to partner
- **Reimbursed:** Payment returned to client — fires webhook, sends email
- **Failed:** Transaction rejected — admin notification sent

### 3.3 Signing Secret Validation

Every API key can have a `signing_secret`. When GatePay sends a callback to a partner:

1. The payload is serialized to JSON
2. HMAC-SHA256 is computed using the signing secret
3. The signature is sent in the `X-GatePay-Signature` header
4. The partner validates the signature before accepting the callback

**This prevents:** Callback forgery, replay attacks, and man-in-the-middle tampering.

### 3.4 Callback Webhooks

When a transaction is verified or reimbursed, GatePay POSTs to the partner's configured callback URL:

```json
{
  "event": "verified",
  "business_name": "Nerdy",
  "sent_at": "2026-05-29T10:00:00Z",
  "transactions": [{
    "transaction_ref": "INV-2026-00482",
    "amount": 1499,
    "currency": "BDT",
    "status": "verified",
    "method": "bkash"
  }]
}
```

### 3.5 Client Identification

Every transaction is linked to a client record via `clientId`. When a payment is verified:

1. The transaction's `clientId` links to the client's name, email, and business
2. The partner receives the `business_name` in the callback (derived from the API key)
3. Confirmation emails are sent to the client's email address

**This means:** Every successful payment gateway transaction gets a verified client identity — not just a transaction ID.

### 3.6 Admin Dashboard

- Transaction list with status filter tabs (Pending/Verified/Reimbursed/Failed)
- Batch status changes
- Status history timeline for every transaction
- Reimbursement tracking with amount, method, and external reference
- Revenue statistics and recent activity

### 3.7 Payment Portal (`/pay/:code`)

Clients can submit payments via a branded payment page:
- bKash payment instructions
- Transaction reference submission
- Auto-invoice generation on payment
- Email confirmation after admin verification

### 3.8 Rate Limiting and Security

- Per-IP rate limiting (30/60 req/min)
- Per-key rate limiting (100 req/min)
- API key hashing (SHA-256, never stored in plaintext)
- CSRF protection
- Input validation via Zod on all endpoints
- 10KB body size limit
- Security headers (HSTS, X-Content-Type-Options, X-Frame-Options)

---

## 4. Current Shortcomings

### 4.1 No Direct Payment Gateway Integration

GatePay currently requires businesses to manually submit transactions. It does not connect directly to SSLCommerz, EPS, or other gateways. This means:

- Transactions must be submitted via API after the gateway confirms payment
- There's a gap between "payment succeeded" (gateway) and "transaction recorded" (GatePay)
- Manual intervention is required to bridge the two systems

### 4.2 No Real-Time Payment Gateway Callbacks

When SSLCommerz confirms a payment, it sends a callback to the business's server. GatePay currently does not receive or process these callbacks directly. The business must:

1. Receive the SSLCommerz callback
2. Extract the transaction details
3. Submit them to GatePay via API

This creates latency and potential for missed transactions.

### 4.3 No Payment Method-Specific Verification

GatePay treats all payment methods uniformly. It does not verify against the payment gateway's own records (e.g., checking SSLCommerz's transaction status API). Verification is based on GatePay's internal records only.

### 4.4 Limited Refund/Reimbursement Integration

Reimbursement tracking is manual. GatePay does not initiate refunds through payment gateways — it only records that a reimbursement was made and tracks its status.

### 4.5 No Webhook Retry Mechanism

If a callback delivery fails (partner server down, network error), GatePay does not automatically retry. Failed callbacks require manual re-triggering.

### 4.6 No Multi-Currency Settlement

GatePay records transactions in multiple currencies but does not handle currency conversion or settlement reporting across currencies.

---

## 5. Payment Gateway Integration Benefits

### 5.1 SSLCommerz Integration

SSLCommerz is Bangladesh's largest payment gateway, supporting bKash, Nagad, Rocket, cards, and internet banking.

**What integration provides:**

| Feature | Benefit |
|---------|---------|
| Auto-capture callbacks | No manual transaction submission — SSLCommerz callbacks flow directly to GatePay |
| Transaction verification against SSLCommerz | Verify that a transaction ID actually exists in SSLCommerz's records |
| Refund initiation | Process refunds through SSLCommerz's API, not manually |
| Real-time status sync | Transaction status updates automatically when SSLCommerz confirms/ denies |
| Multi-method support | bKash, Nagad, Rocket, cards — all handled through one integration |

**With SSLCommerz + GatePay:**

```
Customer pays via bKash
  → SSLCommerz confirms payment
  → SSLCommerz sends callback to GatePay
  → GatePay validates signing secret
  → GatePay identifies the client (via API key → business name → client record)
  → GatePay marks transaction as "Verified"
  → GatePay sends confirmation email to client
  → GatePay fires webhook to partner's system
  → Partner receives verified transaction with client identity
```

### 5.2 EPS (Electronic Payment System) Integration

EPS provides similar gateway services. Integration benefits mirror SSLCommerz but with EPS-specific APIs.

### 5.3 Combined Gateway Benefits

| Benefit | Without GatePay | With GatePay |
|---------|----------------|--------------|
| Client identification | Manual matching | Automatic via API key → client record |
| Transaction verification | Gateway only | Gateway + GatePay dual verification |
| Callback security | Trust the callback | HMAC-SHA256 signature validation |
| Audit trail | None | Full history: who verified, when, status changes |
| Reimbursement tracking | Spreadsheet | Automated with email notifications |
| Fraud detection | Basic | Signing secret + idempotency keys + rate limiting |
| Reporting | Export from gateway | Unified dashboard across all gateways |

---

## 6. How GatePay Adds Value Even With Payment Gateways

### 6.1 Client Identity Layer

Payment gateways return transaction IDs. GatePay returns **who paid**.

```
SSLCommerz callback:
  { "transaction_id": "SSL_12345", "amount": 2500, "status": "success" }

GatePay enrichment:
  { "transaction_ref": "SSL_12345", "amount": 2500, "client": "Acme Corp", "client_email": "billing@acme.com", "verified": true }
```

Every successful gateway transaction gets a human-readable client name, not just a machine ID.

### 6.2 Signing Secret as Defence Against Attacks

The signing secret is GatePay's primary defence mechanism:

**Without signing secret:**
```
Attacker POSTs to callback URL:
  { "transaction_id": "FAKE_123", "status": "success", "amount": 999999 }
Business accepts it → fraud
```

**With signing secret:**
```
Attacker POSTs to callback URL:
  { "transaction_id": "FAKE_123", "status": "success" }
  X-GatePay-Signature: sha256=<wrong signature>
Business validates signature → REJECTED
```

The signing secret ensures:
- Only GatePay can generate valid callbacks
- Payloads cannot be tampered with in transit
- Replay attacks are detected (idempotency keys)
- Each business has a unique secret — compromise of one doesn't affect others

### 6.3 Defence in Depth

GatePay provides multiple security layers that payment gateways alone do not:

1. **API key authentication** — Only registered businesses can submit/verify
2. **Signing secret validation** — Callbacks are cryptographically verified
3. **Rate limiting** — Prevents abuse and DDoS
4. **Idempotency keys** — Prevents duplicate transaction submission
5. **CSRF protection** — Blocks cross-site request forgery
6. **Input validation** — Zod schemas reject malformed data
7. **Audit logging** — Every API call is logged with request ID, IP, and duration
8. **Status history** — Every status change is recorded with who changed it and when

---

## 7. Proposed Enhancements

### Phase 1: Gateway Integration (Priority: High)

- [ ] SSLCommerz callback receiver endpoint
- [ ] SSLCommerz transaction verification API integration
- [ ] EPS callback receiver endpoint
- [ ] Auto-capture: transactions created automatically from gateway callbacks
- [ ] Transaction deduplication across gateway and GatePay

### Phase 2: Enhanced Security (Priority: High)

- [ ] Webhook retry mechanism with exponential backoff
- [ ] Request signing for outbound API calls (not just inbound)
- [ ] IP allowlisting per API key
- [ ] Transaction amount limits per key
- [ ] Anomaly detection (unusual patterns, velocity checks)

### Phase 3: Financial Operations (Priority: Medium)

- [ ] Refund initiation through SSLCommerz/EPS APIs
- [ ] Multi-currency settlement reporting
- [ ] Automated reconciliation reports
- [ ] Invoice generation from verified transactions
- [ ] Tax reporting (VAT, AIT) for Bangladeshi businesses

### Phase 4: Developer Experience (Priority: Medium)

- [ ] Server-side SDK (Node.js, PHP, Python)
- [ ] Webhook delivery logs in dashboard
- [ ] Sandbox environment for testing
- [ ] OpenAPI spec auto-generation
- [ ] Postman collection

---

## 8. Success Metrics

| Metric | Current | Target (6 months) |
|--------|---------|-------------------|
| Transactions verified/day | Manual | 10,000+ (auto-capture) |
| Average verification latency | Minutes | < 3 seconds |
| Callback delivery rate | Manual retry | 99.9% with auto-retry |
| Client identification rate | 0% (manual) | 100% (auto-enriched) |
| Fraud prevention | None | HMAC + idempotency + rate limiting |
| Partner onboarding time | Days | Minutes (API key + callback URL) |

---

## 9. Appendix

### A. API Key Authentication Flow

```
Partner creates API key in GatePay dashboard
  → Receives: gk_xxxxxxxxxxxx (full token, shown once)
  → Stores: keyHash (SHA-256) in GatePay DB
  → Stores: signingSecret (for callback validation)

Partner calls GatePay API:
  Authorization: Bearer gk_xxxxxxxxxxxx
  → GatePay hashes the token
  → Looks up keyHash in DB
  → Validates business_name, callback_url, signing_secret
  → Processes request
```

### B. Callback Signing Flow

```
GatePay verifies a transaction:
  1. Serializes payload to JSON
  2. Computes HMAC-SHA256(payload, signingSecret)
  3. Sends POST to partner's callback_url
     Headers:
       X-GatePay-Signature: sha256=<hex signature>
       User-Agent: GatePay-Verify/1.0

Partner validates:
  1. Reads X-GatePay-Signature header
  2. Computes HMAC-SHA256(request body, my_signing_secret)
  3. Compares signatures
  4. Accepts only if they match
```

### C. Transaction Lifecycle State Machine

```
[Pending] ──verify──→ [Verified] ──reimburse──→ [Reimbursed]
    │                      │
    │                      │
    └─────fail────→ [Failed] ──re-open──→ [Pending]
```

---

*This document is a living artifact. Update as the product evolves.*
