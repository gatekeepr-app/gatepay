"use client";

import { useState, useEffect, useId } from "react";
import { Copy, Check, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SITE = "https://pay.darvizlabs.com";
const VERIFY = `${SITE}/api/v1/public/transactions/verify`;
const SUBMIT = `${SITE}/api/v1/public/transactions/submit`;
const REVIEW = `${SITE}/api/v1/public/transactions/review`;
const REFUND = `${SITE}/api/v1/public/transactions/refund`;
const HEALTH = `${SITE}/api/v1/public/health`;
const OPENAPI = `${SITE}/api/v1/public/openapi`;

const SECTIONS = [
  { id: "overview", label: "Overview" },
  { id: "api-submit", label: "Submit transaction" },
  { id: "api-verify", label: "Verify transaction" },
  { id: "api-review", label: "Review transaction" },
  { id: "api-callback", label: "Verify callback" },
  { id: "api-health", label: "Health check" },
  { id: "api-refund", label: "Request refund" },
  { id: "api-refunds", label: "Refund lifecycle" },
  { id: "errors", label: "Error codes" },
  { id: "security", label: "Security" },
] as const;

function CopyBlock({ code, language = "bash" }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-border bg-muted/40">
      <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
        <span className="font-mono">{language}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded px-2 py-0.5 hover:bg-background"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

function JsonBlock({ json }: { json: Record<string, unknown> }) {
  const code = JSON.stringify(json, null, 2);
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-border bg-muted/40">
      <div className="flex items-center justify-between border-b border-border bg-muted/60 px-3 py-1.5 text-xs text-muted-foreground">
        <span className="font-mono">json</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded px-2 py-0.5 hover:bg-background"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 text-xs leading-relaxed">
        <code className="font-mono">{code}</code>
      </pre>
    </div>
  );
}

function Inline({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>
  );
}

function FieldTable({ fields }: { fields: [string, string, string, string][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
          <tr>
            <th className="px-3 py-2">Field</th>
            <th className="px-3 py-2">Type</th>
            <th className="px-3 py-2">Required</th>
            <th className="px-3 py-2">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {fields.map(([f, t, r, n]) => (
            <tr key={f}>
              <td className="px-3 py-2"><Inline>{f}</Inline></td>
              <td className="px-3 py-2 text-muted-foreground">{t}</td>
              <td className="px-3 py-2">
                <span className={cn("rounded px-1.5 py-0.5 text-xs", r === "Yes" ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>{r}</span>
              </td>
              <td className="px-3 py-2 text-muted-foreground">{n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TOC({ active }: { active: string }) {
  return (
    <nav className="w-56 shrink-0 hidden xl:block">
      <div className="sticky top-24 space-y-1 border-l border-border pl-4">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          On this page
        </div>
        {SECTIONS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            className={cn(
              "block text-sm transition-colors hover:text-foreground",
              active === id ? "text-foreground font-medium" : "text-muted-foreground",
            )}
          >
            {label}
          </a>
        ))}
        <div className="pt-4">
          <a
            href={OPENAPI}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ChevronRight className="h-3 w-3" />
            OpenAPI spec
          </a>
        </div>
      </div>
    </nav>
  );
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h2 className="mb-4 text-xl font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-foreground/80">{children}</div>
    </section>
  );
}

function ApiSection({
  id, title, description, method, path, fields, example,
}: {
  id: string; title: string; description: string; method: string; path: string;
  fields: [string, string, string, string][]; example: Record<string, unknown>;
}) {
  return (
    <section id={id} className="mb-12 scroll-mt-20">
      <h2 className="mb-4 text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mb-3 text-sm leading-relaxed text-foreground/80">{description}</p>
      <h3 className="mb-2 text-sm font-medium">Endpoint</h3>
      <CopyBlock code={`${method} ${path}`} language="http" />
      <h3 className="mb-2 mt-5 text-sm font-medium">Headers</h3>
      <CopyBlock code="Authorization: Bearer YOUR_API_KEY" language="http" />
      <h3 className="mb-2 mt-5 text-sm font-medium">Request body</h3>
      <FieldTable fields={fields} />
      <h3 className="mb-2 mt-5 text-sm font-medium">Example</h3>
      <JsonBlock json={example} />
    </section>
  );
}

export default function PublicApiDocsPage() {
  const [activeSection, setActiveSection] = useState("overview");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-100px 0px -60% 0px" },
    );
    for (const { id } of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-6xl gap-8 px-6 py-12">
        <div className="min-w-0 flex-1">
          <header className="mb-8 border-b border-border pb-6">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              GatePay · Developers
            </div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              Payment Verification API
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Public endpoint that lets partner sites confirm a payment matches a transaction
              recorded in GatePay, and stamp it with the verifier's business identity.
            </p>
          </header>

          <Section id="overview" title="Overview">
            <p>GatePay exposes two primary flows and supporting endpoints for partner sites:</p>
            <ol className="ml-5 list-decimal space-y-2">
              <li>
                <strong>Submit</strong> — your server POSTs a transaction when an order is placed.
                It lands in GatePay as <Inline>unverified</Inline>.
              </li>
              <li>
                <strong>Verify callback (GatePay → your site)</strong> — a GatePay admin
                selects unverified transactions and clicks <strong>Trigger verify</strong>.
                GatePay groups them by business, POSTs each group to your configured{" "}
                <Inline>callback_url</Inline>, and on a <Inline>2xx</Inline> response stamps them as verified.
              </li>
              <li>
                <strong>Verify on demand (your site → GatePay)</strong> — your server can also
                call this endpoint directly to check a single transaction's status.
              </li>
              <li>
                <strong>Refund</strong> — admin-initiated through the dashboard. A verified
                transaction can be refunded via the payment gateway. Partners receive a callback
                with <Inline>event: "reimbursed"</Inline>.
              </li>
            </ol>
            <p>
              All endpoints require an API key via the <Inline>Authorization: Bearer</Inline>{" "}
              header (except health &amp; OpenAPI spec). Manage keys from{" "}
              <strong>Admin → API Keys</strong>. The signing secret is auto-generated
              on creation and can be re-viewed anytime by clicking the eye icon.
            </p>
          </Section>

          <ApiSection
            id="api-submit"
            title="POST — Submit transaction"
            description="Creates an unverified transaction in GatePay. Call this when an order is placed on your end. Safe to retry with the Idempotency-Key header."
            method="POST"
            path={SUBMIT}
            fields={[
              ["transaction_ref", "string (1–120)", "Yes", "Your unique transaction ID."],
              ["amount", "number ≥ 0", "Yes", "Payment amount."],
              ["currency", "string (≤8)", "No", "Defaults to 'BDT'."],
              ["occurred_at", "ISO 8601 datetime", "No", "Defaults to now()."],
              ["method", "string (≤40)", "No", "e.g. 'bkash', 'card', 'nagad'."],
              ["business_name", "string (1–160)", "No*", "Falls back to the API key's business_name."],
              ["external_user_id", "string (≤160)", "No", "Your end-user ID for cross-reference."],
              ["source", "string (≤160)", "No", "Free-form tag, e.g. 'web-checkout'."],
              ["notes", "string (≤2000)", "No", "Free-form notes."],
            ]}
            example={{
              transaction_ref: "INV-2026-00482",
              amount: 1499.00,
              currency: "BDT",
              method: "bkash",
              business_name: "Nerdy",
              external_user_id: "user_8821",
              source: "web-checkout",
              occurred_at: "2026-05-27T10:00:00Z",
            }}
          />

          <ApiSection
            id="api-verify"
            title="POST — Verify transaction"
            description="Checks if a submitted transaction matches a known ref. Returns the transaction details if found. Use when you need to confirm a specific payment on demand."
            method="POST"
            path={VERIFY}
            fields={[
              ["transaction_ref", "string (1–120)", "Yes", "Transaction ID to look up. Case-insensitive."],
              ["business_name", "string (1–160)", "Yes", "Must match the API key's business_name."],
              ["external_user_id", "string (≤160)", "No", "Your internal user ID, stored on the transaction."],
              ["date", "ISO date / datetime", "No", "If set, must match the transaction's UTC day."],
              ["amount", "number ≥ 0", "No", "If set, must equal recorded amount exactly."],
              ["source", "string (≤160)", "No", "Free-form audit label."],
            ]}
            example={{
              transaction_ref: "INV-2026-00482",
              business_name: "Nerdy",
              external_user_id: "user_8821",
              date: "2026-05-27",
              amount: 1499.00,
              source: "web-checkout",
            }}
          />

          <ApiSection
            id="api-review"
            title="POST — Review transaction"
            description="Submits a client-side review (confirmed amount + note) against an existing transaction. Use when you want your customer or internal team to confirm or annotate a recorded transaction."
            method="POST"
            path={REVIEW}
            fields={[
              ["transaction_id", "string", "Yes", "Transaction ID returned by the submit endpoint."],
              ["amount", "number ≥ 0", "Yes", "Confirmed amount for the transaction."],
              ["note", "string (≤2000)", "Yes", "Review note or feedback."],
            ]}
            example={{
              transaction_id: "jf3m2k9x1p",
              amount: 1499.00,
              note: "Payment confirmed by customer — project setup fee.",
            }}
          />

          <section id="api-callback" className="mb-12 scroll-mt-20">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Verify callback (GatePay → your site)</h2>
            <p className="mb-3 text-sm leading-relaxed text-foreground/80">
              When an admin clicks <strong>Trigger verify</strong> in the dashboard, GatePay
              groups the selected transactions by business name, finds the matching API key's{" "}
              <Inline>callback_url</Inline>, and POSTs each group to that URL. Your 2xx response
              is the verification — nothing more needed.
            </p>

            <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-950/30">
              <p className="font-medium text-amber-800 dark:text-amber-300">What is a callback URL?</p>
              <p className="mt-1 text-amber-700 dark:text-amber-400">
                A <strong>callback URL</strong> is an HTTP endpoint on your own server that
                GatePay calls to confirm a batch of transactions. Example:{" "}
                <Inline>https://api.nerdy.com/gatekeepr/verify</Inline>. It must be HTTPS, must
                return a <Inline>2xx</Inline> to confirm verification, and you can verify the
                request via the <Inline>X-GatePay-Signature</Inline> HMAC header.
              </p>
            </div>

            <h3 className="mb-2 text-sm font-medium">Why verify fails from the admin</h3>
            <p className="mb-3 text-sm leading-relaxed text-foreground/80">
              If your API key has no <Inline>callback_url</Inline> set, or the URL is unreachable
              (like <Inline>https://example.com/verify</Inline>), the admin verification will show{" "}
              <Inline>skipped_no_callback</Inline> or <Inline>callback_timeout</Inline>. Set a real
              callback URL on your API key in <strong>Admin → API Keys</strong>.
            </p>

            <h3 className="mb-2 mt-5 text-sm font-medium">Request GatePay sends</h3>
            <CopyBlock
              code={`POST <your callback_url>
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
}`}
              language="http"
            />

            <h3 className="mb-2 mt-5 text-sm font-medium">What your endpoint should do</h3>
            <ol className="ml-5 list-decimal space-y-2 text-sm text-foreground/80">
              <li>Verify the <Inline>X-GatePay-Signature</Inline> HMAC (optional but recommended).</li>
              <li>For each transaction, look it up in your own DB and confirm it matches a real order.</li>
              <li>Respond <Inline>2xx</Inline> if everything checks out — GatePay stamps the batch as verified.</li>
              <li>Respond with a non-2xx status and a JSON error body on failure.</li>
              <li>You do <strong>not</strong> need to call the verify endpoint from inside the callback.</li>
            </ol>
          </section>

          <section id="api-health" className="mb-12 scroll-mt-20">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">GET — Health check</h2>
            <p className="mb-3 text-sm leading-relaxed text-foreground/80">
              Lightweight endpoint to verify the API is operational. No auth required.
            </p>
            <CopyBlock code={`GET ${HEALTH}`} language="http" />
            <CopyBlock code={`{"status":"ok"}`} language="json" />
          </section>

          <ApiSection
            id="api-refund"
            title="POST — Request refund"
            description="Request a refund for a verified transaction. The client specifies who should receive the refund (name and number) and the amount. Refunds are processed by GatePay and require the transaction to be in verified status."
            method="POST"
            path={REFUND}
            fields={[
              ["transaction_ref", "string (1–120)", "Yes", "Transaction ID to refund. Must belong to the same business."],
              ["amount", "number > 0", "Yes", "Refund amount. Cannot exceed the original transaction amount."],
              ["method", "string (1–40)", "Yes", "Refund method: 'bKash', 'Nagad', 'Rocket', 'bank_transfer', 'other'."],
              ["receiver_name", "string (1–256)", "Yes", "Full name of the person receiving the refund."],
              ["receiver_number", "string (1–64)", "Yes", "Account or phone number of the receiver."],
              ["notes", "string (≤2000)", "No", "Free-form notes about the refund."],
            ]}
            example={{
              transaction_ref: "INV-2026-00482",
              amount: 1499.00,
              method: "bKash",
              receiver_name: "Rafid Mahim",
              receiver_number: "01712345678",
              notes: "Customer requested full refund",
            }}
          />

          <section id="api-refunds" className="mb-12 scroll-mt-20">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Refund lifecycle</h2>
            <p className="mb-3 text-sm leading-relaxed text-foreground/80">
              Refunds can be initiated by clients via the API or by admins through the dashboard.
              The flow is: initiate → process via payment gateway → complete or fail.
            </p>
            <p className="mb-3 text-sm leading-relaxed text-foreground/80">
              Only <Inline>verified</Inline> transactions can be refunded. The receiver name and
              number are required — these specify who receives the refunded amount.
            </p>

            <h3 className="mb-2 mt-5 text-sm font-medium">Lifecycle</h3>
            <ol className="ml-5 list-decimal space-y-2 text-sm text-foreground/80">
              <li><strong>Initiate</strong> — admin clicks &quot;Initiate Refund&quot; on a verified transaction, enters amount, method, and optional reference. Creates a refund record with status <Inline>pending</Inline>.</li>
              <li><strong>Process</strong> — system calls the payment gateway (SSLCommerz) refund API. Refund status moves to <Inline>processing</Inline>.</li>
              <li><strong>Complete</strong> — on gateway confirmation, refund status becomes <Inline>completed</Inline> and the transaction status moves to <Inline>reimbursed</Inline>.</li>
              <li><strong>Cancel</strong> — admin can cancel a pending or processing refund. Cancellation is not allowed once completed.</li>
            </ol>

            <h3 className="mb-2 mt-5 text-sm font-medium">Refund statuses</h3>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {([
                    ["pending", "Refund initiated, waiting for gateway processing"],
                    ["processing", "Gateway has accepted the refund request"],
                    ["completed", "Refund succeeded — transaction is now reimbursed"],
                    ["failed", "Gateway rejected the refund"],
                    ["cancelled", "Admin cancelled before completion"],
                  ] as [string, string][]).map(([s, m]) => (
                    <tr key={s}>
                      <td className="px-3 py-2"><Inline>{s}</Inline></td>
                      <td className="px-3 py-2 text-muted-foreground">{m}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3 className="mb-2 mt-5 text-sm font-medium">What gets logged</h3>
            <ul className="ml-5 list-disc space-y-2 text-sm text-foreground/80">
              <li>Every refund action is recorded in the <Inline>statusHistory</Inline> table with from/to status and notes.</li>
              <li>On completion, the transaction stores: <Inline>reimbursedAt</Inline>, <Inline>reimbursementAmount</Inline>, <Inline>reimbursementRef</Inline>, and <Inline>reimbursementMethod</Inline>.</li>
              <li>Partners receive a callback with <Inline>event: "reimbursed"</Inline> when the transaction status changes.</li>
            </ul>
          </section>

          <section id="errors" className="mb-12 scroll-mt-20">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Error codes</h2>
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Response</th>
                    <th className="px-3 py-2">Meaning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {([
                    ["201", `{"received":true,"status":"unverified"}`, "Submit success"],
                    ["201", `{"refund_id":"...","status":"pending",...}`, "Refund requested"],
                    ["200", `{"verified":true,"transaction":{...}}`, "Transaction matches"],
                    ["200", `{"verified":false,"reason":"not_found"}`, "No matching transaction"],
                    ["200", `{"verified":false,"reason":"date_mismatch"}`, "Date doesn't match"],
                    ["200", `{"verified":false,"reason":"amount_mismatch"}`, "Amount doesn't match"],
                    ["400", `{"error":"invalid_body","issues":[...]}`, "Zod validation failed"],
                    ["400", `{"error":"invalid_json"}`, "Body is not valid JSON"],
                    ["401", `{"error":"missing_api_key"}`, "No Authorization header"],
                    ["401", `{"error":"invalid_api_key"}`, "Token unknown or revoked"],
                    ["404", `{"error":"transaction_not_found"}`, "Transaction doesn't exist or belongs to another business"],
                    ["409", `{"error":"duplicate_ref"}`, "Ref already exists (submit)"],
                    ["409", `{"error":"transaction_not_verified"}`, "Transaction must be verified before refund"],
                    ["413", `{"error":"body_too_large"}`, "Body exceeds 10 KB"],
                    ["429", `{"error":"rate_limited"}`, "IP rate limit hit (30/60 req/min)"],
                    ["429", `{"error":"key_rate_limited"}`, "Key rate limit hit (100 req/min)"],
                    ["500", `{"verified":false,"reason":"lookup_error"}`, "Server / DB error"],
                  ] as [string, string, string][]).map(([s, r, m]) => (
                    <tr key={r}>
                      <td className="px-3 py-2">
                        <span className={cn("rounded px-1.5 py-0.5 font-mono text-xs", s.startsWith("2") ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : s.startsWith("4") ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400")}>{s}</span>
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">{r}</td>
                      <td className="px-3 py-2 text-muted-foreground">{m}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Every response includes an <Inline>x-request-id</Inline> header. Include this when reporting issues.
            </p>
          </section>

          <section id="security" className="mb-12 scroll-mt-20">
            <h2 className="mb-4 text-xl font-semibold tracking-tight">Security</h2>
            <ul className="ml-5 list-disc space-y-2 text-sm text-foreground/80">
              <li>All endpoints require HTTPS. HTTP requests are rejected.</li>
              <li>API keys are hashed with SHA-256 before storage. Revocation is immediate.</li>
              <li><strong>Tenant isolation:</strong> keys can only verify transactions matching their own <Inline>business_name</Inline>.</li>
              <li><strong>Rate limits:</strong> verify 30 req/min/IP, submit 60 req/min/IP, 100 req/min per key.</li>
              <li>Request body limited to 10 KB. CSRF enforced when Origin/Referer is present.</li>
              <li>Responses include <Inline>Strict-Transport-Security</Inline> and <Inline>X-Content-Type-Options</Inline>.</li>
              <li>Callback URLs must use HTTPS. Callbacks have a 15-second timeout.</li>
              <li>Callback signatures use HMAC-SHA256 with your key's <Inline>signing_secret</Inline>.</li>
            </ul>
          </section>

          <footer className="mt-12 border-t border-border pt-6 text-xs text-muted-foreground">
            Questions? Contact the GatePay team.
          </footer>
        </div>
        <TOC active={activeSection} />
      </div>
    </div>
  );
}


