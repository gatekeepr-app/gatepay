# GatePay Payment Integration Guide

GatePay is a payment verification gateway for bKash and other mobile-money services in Bangladesh. It lets you accept, verify, and manage payments from your website or app through a simple REST API.

**Base URL:** `https://pay.darvizlabs.com/api/v1/public`  
**Docs site:** `https://pay.darvizlabs.com/docs/payments-api`  
**OpenAPI spec:** `https://pay.darvizlabs.com/api/v1/public/openapi`

---

## Table of Contents

1. [How it works](#how-it-works)
2. [Getting started](#getting-started)
3. [API reference](#api-reference)
   - [Submit transaction](#submit-transaction)
   - [Verify transaction](#verify-transaction)
   - [Review transaction](#review-transaction)
   - [Request refund](#request-refund)
   - [Health check](#health-check)
4. [Payment flow](#payment-flow)
5. [Callback handling](#callback-handling)
6. [Error codes](#error-codes)
7. [Security](#security)
8. [Payment module (optional)](#payment-module-optional)
9. [TypeScript module example](#typescript-module-example)
10. [Python module example](#python-module-example)

---

## How it works

GatePay follows a two-step payment flow:

1. **Submit** — Your server sends transaction details to GatePay when a client places an order. The transaction is recorded as `unverified` (pending).

2. **Verify** — Verification happens one of two ways:
   - **Callback (auto):** A GatePay admin triggers verification. GatePay groups transactions by business, POSTs them to your configured callback URL, and stamps them as `verified` when you respond `2xx`.
   - **On-demand (manual):** Your server calls the verify endpoint to check a single transaction.

3. **Optional:** Use the customer-facing pay page (`https://pay.darvizlabs.com/pay/CODE`) where clients can submit bKash transaction IDs for subscription/monthly billing directly.

---

## Getting started

### 1. Get an API key

Log into the GatePay admin dashboard → **API Keys** → **New key**.

Each key has:
- **API Key** — sent in the `Authorization: Bearer` header
- **Signing Secret** — used to verify HMAC signatures on callbacks
- **Business Name** — scopes the key to transactions for that business
- **Callback URL** — your HTTPS endpoint that receives verification callbacks

### 2. Set environment variables

```bash
GATEKEEPR_API_KEY="gk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
GATEKEEPR_SIGNING_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
GATEKEEPR_BASE_URL="https://pay.darvizlabs.com/api/v1/public"
```

### 3. Make your first call

```bash
curl -X POST https://pay.darvizlabs.com/api/v1/public/transactions/verify \
  -H "Authorization: Bearer gk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_ref": "INV-2026-00001",
    "business_name": "Nerdy"
  }'
```

---

## API reference

All endpoints return JSON. Requests must use HTTPS. Include the API key in the `Authorization` header as a Bearer token.

**Request body format:** `snake_case` fields in JSON.

---

### Submit transaction

Creates an unverified transaction. Call this when an order is placed on your end.

**Endpoint:** `POST /transactions/submit`  
**Rate limit:** 60 req/min per IP, 100 req/min per key

**Headers:**
```
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json
Idempotency-Key: YOUR_UNIQUE_KEY (optional, safe retry)
```

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `transaction_ref` | string (1–256) | Yes | Your unique transaction ID |
| `amount` | number (≥0) | Yes | Payment amount |
| `currency` | string | No | Defaults to `"BDT"` |
| `occurred_at` | string (ISO 8601) | No | Defaults to now |
| `method` | string | No | e.g. `"bkash"`, `"nagad"`, `"card"` |
| `business_name` | string | No | Falls back to the API key's business name |
| `external_user_id` | string | No | Your end-user ID for cross-reference |
| `source` | string | No | Free-form tag e.g. `"web-checkout"` |
| `notes` | string (≤2000) | No | Free-form notes |

**Example request:**
```bash
curl -X POST https://pay.darvizlabs.com/api/v1/public/transactions/submit \
  -H "Authorization: Bearer gk_xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_ref": "INV-2026-00482",
    "amount": 1499.00,
    "currency": "BDT",
    "method": "bkash",
    "business_name": "Nerdy",
    "external_user_id": "user_8821",
    "source": "web-checkout",
    "occurred_at": "2026-05-27T10:00:00Z"
  }'
```

**Success response (201):**
```json
{
  "received": true,
  "id": "jf3m2k9x1p",
  "transaction_ref": "INV-2026-00482",
  "status": "unverified"
}
```

**Duplicate (200):** If the same `transaction_ref` already exists:
```json
{
  "received": true,
  "id": "jf3m2k9x1p",
  "transaction_ref": "INV-2026-00482",
  "status": "already_exists",
  "duplicate": true
}
```

**Idempotency:** Send an `Idempotency-Key` header to safely retry. If the key matches a previous submission, GatePay returns the existing record instead of creating a duplicate.

---

### Verify transaction

Checks if a submitted transaction matches a known reference. Returns the transaction details if found.

**Endpoint:** `POST /transactions/verify`  
**Rate limit:** 30 req/min per IP, 100 req/min per key

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `transaction_ref` | string (1–256) | Yes | Transaction ID to look up (case-insensitive) |
| `business_name` | string (1–256) | Yes | Must match the API key's business name |
| `external_user_id` | string | No | Your internal user ID, stored on the transaction |
| `date` | string (ISO) | No | If set, must match the transaction's UTC day |
| `amount` | number | No | If set, must equal recorded amount exactly |
| `source` | string | No | Free-form audit label |

**Example request:**
```bash
curl -X POST https://pay.darvizlabs.com/api/v1/public/transactions/verify \
  -H "Authorization: Bearer gk_xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_ref": "INV-2026-00482",
    "business_name": "Nerdy",
    "date": "2026-05-27",
    "amount": 1499.00
  }'
```

**Success response (200):**
```json
{
  "verified": true,
  "transaction": {
    "ref": "INV-2026-00482",
    "amount": 1499.00,
    "currency": "BDT",
    "occurred_at": 1748412000000,
    "project_code": "NERDY-001"
  }
}
```

**Not found (200):**
```json
{
  "verified": false,
  "reason": "not_found"
}
```

**Other mismatch reasons:** `date_mismatch`, `amount_mismatch`

> **Note:** Verification is scoped by business name — you can only verify transactions that belong to your API key's business. If the transaction exists under a different business, it returns `not_found` (no info leak).

---

### Review transaction

Submits a client-side review (confirmed amount + note) against an existing transaction. Useful when customers or your internal team need to annotate or confirm a recorded payment.

**Endpoint:** `POST /transactions/review`  
**Rate limit:** 30 req/min per IP

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `transaction_id` | string | Yes | Transaction ID returned by the submit endpoint |
| `amount` | number (≥0) | Yes | Confirmed amount |
| `note` | string (≤2000) | Yes | Review note or feedback |

**Example request:**
```bash
curl -X POST https://pay.darvizlabs.com/api/v1/public/transactions/review \
  -H "Authorization: Bearer gk_xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "jf3m2k9x1p",
    "amount": 1499.00,
    "note": "Payment confirmed by customer — project setup fee."
  }'
```

---

### Request refund

Request a refund for a verified transaction. Only `verified` transactions can be refunded.

**Endpoint:** `POST /transactions/refund`  
**Rate limit:** 20 req/min per IP, 50 req/min per key

**Request body:**

| Field | Type | Required | Description |
|---|---|---|---|
| `transaction_ref` | string | Yes | Transaction ID to refund |
| `amount` | number (>0) | Yes | Refund amount (cannot exceed original) |
| `method` | string | Yes | e.g. `"bKash"`, `"Nagad"`, `"Rocket"`, `"bank_transfer"` |
| `receiver_name` | string | Yes | Full name of the person receiving the refund |
| `receiver_number` | string | Yes | Account or phone number of the receiver |
| `notes` | string | No | Free-form notes about the refund |

**Example request:**
```bash
curl -X POST https://pay.darvizlabs.com/api/v1/public/transactions/refund \
  -H "Authorization: Bearer gk_xxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_ref": "INV-2026-00482",
    "amount": 1499.00,
    "method": "bKash",
    "receiver_name": "Rafid Mahim",
    "receiver_number": "01712345678",
    "notes": "Customer requested full refund"
  }'
```

**Success response (201):**
```json
{
  "refund_id": "rf_abc123",
  "status": "pending",
  "transaction_ref": "INV-2026-00482",
  "amount": 1499.00,
  "currency": "BDT",
  "method": "bKash",
  "receiver_name": "Rafid Mahim",
  "receiver_number": "01712345678"
}
```

**Refund lifecycle:** `pending` → `processing` → `completed` (transaction becomes `reimbursed`)  
**Cancel states:** `pending` → `cancelled`, `processing` → `cancelled`

---

### Health check

Lightweight endpoint to verify the API is operational. No auth required.

```bash
curl https://pay.darvizlabs.com/api/v1/public/health
```

**Response (200):**
```json
{ "status": "ok" }
```

---

## Payment flow

### Standard flow (server-to-server)

```
┌──────────┐        ┌──────────┐        ┌──────────┐
│  Client  │        │  Your    │        │  GatePay │
│ (browser)│        │  Server  │        │          │
└────┬─────┘        └────┬─────┘        └────┬─────┘
     │                   │                   │
     │  1. Place order   │                   │
     │──────────────────>│                   │
     │                   │                   │
     │  2. Submit TXN    │                   │
     │                   │──────────────────>│
     │                   │    POST /submit    │
     │                   │                   │
     │                   │◄──────────────────│
     │                   │  { status: unverified }
     │                   │                   │
     │  3. Client pays   │                   │
     │  via bKash / etc  │                   │
     │                   │                   │
     │  4. Submit TXN ID │                   │
     │──────────────────>│                   │
     │                   │                   │
     │  5. Verify TXN    │                   │
     │                   │──────────────────>│
     │                   │   POST /verify    │
     │                   │                   │
     │                   │◄──────────────────│
     │                   │  { verified: true │
     │                   │    transaction... }│
     │                   │                   │
     │  6. Confirm       │                   │
     │◄──────────────────│                   │
```

### Subscription flow (customer-facing pay page)

For subscription/monthly billing, you can use GatePay's built-in pay page at `https://pay.darvizlabs.com/pay/CODE`:

1. **Create a project** with billing config (monthly amount) in the admin dashboard
2. **Share the pay link** with your client: `https://pay.darvizlabs.com/pay/DNKX4U`
3. **Client pays** via bKash and submits the transaction ID on the page
4. **Transaction is auto-verified** as a subscription payment (`verifiedSource: "subscription"`)
5. **Client receives** a confirmation email with payment details

---

## Callback handling

When admin triggers verification, GatePay POSTs to your configured callback URL with transaction data. Your endpoint must respond `2xx` to confirm.

### Request from GatePay

```
POST <your callback URL>
Content-Type: application/json
X-GatePay-Signature: sha256=<hex hmac>
User-Agent: GatePay-Verify/1.0

{
  "business_name": "Nerdy",
  "sent_at": "2026-05-27T16:30:00.000Z",
  "transactions": [
    {
      "transaction_ref": "INV-2026-00482",
      "amount": 1499.00,
      "currency": "BDT",
      "occurred_at": "2026-05-27T10:00:00.000Z",
      "method": "bkash",
      "external_user_id": "user_8821",
      "source": "web-checkout"
    }
  ]
}
```

### Verifying the HMAC signature (recommended)

The `X-GatePay-Signature` header contains `sha256=<hex>` computed as HMAC-SHA256 of the raw request body using your **signing secret**. Verify it like this:

```typescript
import crypto from "node:crypto";

function verifySignature(payload: string, signatureHeader: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return `sha256=${expected}` === signatureHeader;
}
```

```python
import hmac, hashlib

def verify_signature(payload: str, signature_header: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload.encode(),
        hashlib.sha256
    ).hexdigest()
    return f"sha256={expected}" == signature_header
```

### What your endpoint should do

1. Verify the `X-GatePay-Signature` (optional but recommended)
2. For each transaction, look it up in your own DB and confirm it matches a real order
3. Respond `2xx` if everything checks out — GatePay stamps the batch as verified
4. Respond with a non-2xx status on failure
5. You do **not** need to call the verify endpoint from inside the callback

---

## Error codes

| Status | Response body | Meaning |
|---|---|---|
| 201 | `{"received":true,"status":"unverified"}` | Submit success |
| 201 | `{"refund_id":"...","status":"pending"}` | Refund requested |
| 200 | `{"verified":true,"transaction":{...}}` | Transaction matches |
| 200 | `{"verified":false,"reason":"not_found"}` | No matching transaction |
| 200 | `{"verified":false,"reason":"date_mismatch"}` | Date doesn't match |
| 200 | `{"verified":false,"reason":"amount_mismatch"}` | Amount doesn't match |
| 400 | `{"error":"invalid_body","issues":[...]}` | Zod validation failed |
| 400 | `{"error":"invalid_json"}` | Body is not valid JSON |
| 400 | `{"error":"missing_business_name"}` | No business name on submit |
| 400 | `{"error":"key_missing_business_name"}` | API key has no business name |
| 401 | `{"error":"missing_api_key"}` | No Authorization header |
| 401 | `{"error":"invalid_api_key"}` | Token unknown or revoked |
| 404 | `{"error":"transaction_not_found"}` | TXN doesn't exist or belongs to another business |
| 409 | `{"error":"duplicate_ref"}` | Ref already exists (submit) |
| 409 | `{"error":"transaction_not_verified"}` | Must be verified before refund |
| 413 | `{"error":"body_too_large"}` | Body exceeds 10 KB |
| 429 | `{"error":"rate_limited"}` | IP rate limit hit |
| 429 | `{"error":"key_rate_limited"}` | Key rate limit hit |
| 500 | `{"verified":false,"reason":"lookup_error"}` | Server / DB error |

Every response includes an `x-request-id` header. Include this when reporting issues.

---

## Security

- All endpoints require HTTPS
- API keys are hashed with SHA-256 before storage. Revocation is immediate.
- **Tenant isolation:** Keys can only access transactions matching their own `business_name`
- **Rate limits:** Verify 30 req/min/IP, Submit 60 req/min/IP, 100 req/min per key
- Request body limited to 10 KB. CSRF enforced when Origin/Referer is present.
- Responses include `Strict-Transport-Security` and `X-Content-Type-Options` headers
- Callback URLs must use HTTPS. Callbacks have a 15-second timeout.
- Callback signatures use HMAC-SHA256 with your key's `signing_secret`

---

## Payment module (optional)

You can wrap GatePay into a reusable client module in your codebase. Below are example implementations.

### TypeScript/Node.js module

```typescript
// gatepay.ts — Drop this into your project

interface GatePayConfig {
  apiKey: string;
  signingSecret: string;
  baseUrl?: string;
}

interface SubmitPayload {
  transaction_ref: string;
  amount: number;
  currency?: string;
  method?: string;
  business_name?: string;
  external_user_id?: string;
  source?: string;
  notes?: string;
  occurred_at?: string;
}

interface VerifyPayload {
  transaction_ref: string;
  business_name: string;
  date?: string;
  amount?: number;
  external_user_id?: string;
  source?: string;
}

interface RefundPayload {
  transaction_ref: string;
  amount: number;
  method: string;
  receiver_name: string;
  receiver_number: string;
  notes?: string;
}

interface ReviewPayload {
  transaction_id: string;
  amount: number;
  note: string;
}

class GatePayError extends Error {
  constructor(
    public status: number,
    public code: string,
    public details?: any,
  ) {
    super(code);
    this.name = "GatePayError";
  }
}

class GatePay {
  private baseUrl: string;
  private apiKey: string;
  private signingSecret: string;

  constructor(config: GatePayConfig) {
    this.apiKey = config.apiKey;
    this.signingSecret = config.signingSecret;
    this.baseUrl = config.baseUrl ?? "https://pay.darvizlabs.com/api/v1/public";
  }

  private async request<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new GatePayError(
        res.status,
        data.error ?? "unknown_error",
        data.issues ?? data,
      );
    }

    return data as T;
  }

  /** Submit a new transaction for verification */
  async submit(payload: SubmitPayload) {
    return this.request<{
      received: boolean;
      id: string;
      transaction_ref: string;
      status: string;
      duplicate?: boolean;
    }>("/transactions/submit", payload);
  }

  /** Verify a submitted transaction */
  async verify(payload: VerifyPayload) {
    return this.request<{
      verified: boolean;
      transaction?: any;
      reason?: string;
    }>("/transactions/verify", payload);
  }

  /** Review/annotate an existing transaction */
  async review(payload: ReviewPayload) {
    return this.request<{
      reviewed: boolean;
      transaction?: any;
      reason?: string;
    }>("/transactions/review", payload);
  }

  /** Request a refund for a verified transaction */
  async refund(payload: RefundPayload) {
    return this.request<{
      refund_id: string;
      status: string;
      transaction_ref: string;
      amount: number;
      currency: string;
      method: string;
      receiver_name: string;
      receiver_number: string;
    }>("/transactions/refund", payload);
  }

  /** Check API health */
  async health(): Promise<{ status: string }> {
    const res = await fetch(`${this.baseUrl}/health`);
    return res.json();
  }
}

export { GatePay, GatePayError };
export type {
  GatePayConfig, SubmitPayload, VerifyPayload,
  RefundPayload, ReviewPayload,
};
```

#### Usage

```typescript
import { GatePay } from "./gatepay";

const gp = new GatePay({
  apiKey: process.env.GATEKEEPR_API_KEY!,
  signingSecret: process.env.GATEKEEPR_SIGNING_SECRET!,
});

// Submit a transaction
const submit = await gp.submit({
  transaction_ref: "INV-2026-00482",
  amount: 1499.00,
  currency: "BDT",
  method: "bkash",
  business_name: "Nerdy",
});
console.log(submit.status); // "unverified"

// Verify it later
const verify = await gp.verify({
  transaction_ref: "INV-2026-00482",
  business_name: "Nerdy",
  amount: 1499.00,
});
console.log(verify.verified); // true or false
```

---

### Python module

```python
# gatepay.py — Drop this into your project

import hashlib
import hmac
from dataclasses import dataclass, asdict
from typing import Optional
import httpx


class GatePayError(Exception):
    def __init__(self, status: int, code: str, details: Optional[dict] = None):
        self.status = status
        self.code = code
        self.details = details
        super().__init__(code)


@dataclass
class GatePayConfig:
    api_key: str
    signing_secret: str
    base_url: str = "https://pay.darvizlabs.com/api/v1/public"


@dataclass
class SubmitPayload:
    transaction_ref: str
    amount: float
    currency: Optional[str] = None
    method: Optional[str] = None
    business_name: Optional[str] = None
    external_user_id: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None
    occurred_at: Optional[str] = None


@dataclass
class VerifyPayload:
    transaction_ref: str
    business_name: str
    date: Optional[str] = None
    amount: Optional[float] = None
    external_user_id: Optional[str] = None
    source: Optional[str] = None


@dataclass
class RefundPayload:
    transaction_ref: str
    amount: float
    method: str
    receiver_name: str
    receiver_number: str
    notes: Optional[str] = None


@dataclass
class ReviewPayload:
    transaction_id: str
    amount: float
    note: str


class GatePay:
    def __init__(self, config: GatePayConfig):
        self.config = config

    def _headers(self) -> dict:
        return {
            "Authorization": f"Bearer {self.config.api_key}",
            "Content-Type": "application/json",
        }

    def _request(self, path: str, payload: dict) -> dict:
        with httpx.Client(base_url=self.config.base_url) as client:
            resp = client.post(path, json=payload, headers=self._headers())
            data = resp.json()
            if not resp.is_success:
                raise GatePayError(
                    resp.status_code,
                    data.get("error", "unknown_error"),
                    data.get("issues", data),
                )
            return data

    def submit(self, payload: SubmitPayload) -> dict:
        return self._request("/transactions/submit", asdict(payload))

    def verify(self, payload: VerifyPayload) -> dict:
        return self._request("/transactions/verify", asdict(payload))

    def review(self, payload: ReviewPayload) -> dict:
        return self._request("/transactions/review", asdict(payload))

    def refund(self, payload: RefundPayload) -> dict:
        return self._request("/transactions/refund", asdict(payload))

    def health(self) -> dict:
        with httpx.Client(base_url=self.config.base_url) as client:
            resp = client.get("/health")
            return resp.json()

    @staticmethod
    def verify_signature(payload: str, signature_header: str, secret: str) -> bool:
        expected = hmac.new(
            secret.encode(),
            payload.encode(),
            hashlib.sha256,
        ).hexdigest()
        return f"sha256={expected}" == signature_header


# Example usage
if __name__ == "__main__":
    gp = GatePay(GatePayConfig(
        api_key="gk_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        signing_secret="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    ))

    # Submit
    result = gp.submit(SubmitPayload(
        transaction_ref="INV-2026-00482",
        amount=1499.00,
        currency="BDT",
        method="bkash",
        business_name="Nerdy",
    ))
    print(f"Submitted: {result['status']}")

    # Verify
    verify = gp.verify(VerifyPayload(
        transaction_ref="INV-2026-00482",
        business_name="Nerdy",
    ))
    print(f"Verified: {verify['verified']}")
```

---

### Express.js middleware example

```typescript
// gatepay-middleware.ts — Express route handler

import { Router } from "express";
import crypto from "node:crypto";
import { GatePay } from "./gatepay";

const router = Router();
const gp = new GatePay({
  apiKey: process.env.GATEKEEPR_API_KEY!,
  signingSecret: process.env.GATEKEEPR_SIGNING_SECRET!,
});

// POST /api/checkout — place an order + submit to GatePay
router.post("/checkout", async (req, res) => {
  const { amount, userId, items } = req.body;

  const ref = `INV-${Date.now()}`;

  // Submit to GatePay
  const submit = await gp.submit({
    transaction_ref: ref,
    amount,
    currency: "BDT",
    method: "bkash",
    business_name: "Nerdy",
    external_user_id: userId,
    source: "web-checkout",
  });

  // Store in your DB
  await db.orders.create({
    ref,
    userId,
    amount,
    items,
    gatepayId: submit.id,
    status: "pending",
  });

  res.json({ ref, status: "pending" });
});

// POST /api/gatepay/callback — receive GatePay verification callback
router.post("/gatepay/callback", async (req, res) => {
  const signature = req.headers["x-gatepay-signature"] as string;
  const rawBody = JSON.stringify(req.body);

  // Verify HMAC
  const expected = crypto
    .createHmac("sha256", process.env.GATEKEEPR_SIGNING_SECRET!)
    .update(rawBody)
    .digest("hex");

  if (`sha256=${expected}` !== signature) {
    return res.status(401).json({ error: "invalid signature" });
  }

  // Process each transaction
  for (const tx of req.body.transactions) {
    await db.orders.update({
      where: { ref: tx.transaction_ref },
      data: { status: "verified", gatepayVerifiedAt: new Date() },
    });

    // Notify user
    await notifyUser(tx.external_user_id, `Payment of ${tx.amount} BDT confirmed`);
  }

  res.sendStatus(200);
});

// GET /api/order/:ref/status — check payment status
router.get("/order/:ref/status", async (req, res) => {
  const verify = await gp.verify({
    transaction_ref: req.params.ref,
    business_name: "Nerdy",
  });

  res.json({
    ref: req.params.ref,
    verified: verify.verified,
    transaction: verify.transaction,
  });
});

export { router as paymentRouter };
```

---

## Subscription module (optional)

For recurring monthly billing via the customer-facing pay page:

```typescript
// subscription.ts — Link your customers to GatePay pay pages

class GatePaySubscription {
  private baseUrl = "https://pay.darvizlabs.com";

  /** Generate the payment URL for a client */
  getPayLink(payCode: string): string {
    return `${this.baseUrl}/pay/${payCode}`;
  }

  /** Share payment link via email or SMS */
  async sendPaymentLink(email: string, payCode: string, amount: number): Promise<void> {
    const url = this.getPayLink(payCode);
    // Send email/SMS with payment instructions
    console.log(`Payment link for ${email}: ${url} — ${amount} BDT monthly`);
  }
}

// Usage
const subs = new GatePaySubscription();

// 1. Admin creates a project with billing config in the dashboard
// 2. Share the link
const link = subs.getPayLink("DNKX4U");
console.log(`Client pays here: ${link}`);

// 3. Client opens link, selects month, pays via bKash
// 4. Transaction is auto-verified as subscription payment
// 5. Confirmation email sent to client
```

---

### Integration checklist

| Step | Done? |
|---|---|
| Create API key in GatePay admin dashboard | ☐ |
| Set `GATEKEEPR_API_KEY` and `GATEKEEPR_SIGNING_SECRET` env vars | ☐ |
| Add callback URL to API key (for auto-verification) | ☐ |
| Implement callback endpoint with HMAC verification | ☐ |
| Call `POST /submit` when orders are placed | ☐ |
| Call `POST /verify` to check payment status | ☐ |
| Handle error codes gracefully | ☐ |
| Secure your signing secret (never expose client-side) | ☐ |

---

**Questions?** Contact the GatePay team.
