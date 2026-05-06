import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_admin/admin/api-docs")({
  component: ApiDocsPage,
});

const BASE_URL = "https://gatekeepr-foundations-build.lovable.app";
const ENDPOINT = `${BASE_URL}/api/public/transactions/verify`;

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

function Inline({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em]">{children}</code>
  );
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="mb-10 scroll-mt-20">
      <h2 className="mb-3 text-xl font-semibold tracking-tight">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-foreground/80">{children}</div>
    </section>
  );
}

const curlExample = `curl -X POST ${ENDPOINT} \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "transaction_ref": "TXN-2026-00482",
    "business_name": "Nerdy",
    "external_user_id": "user_8821",
    "date": "2026-05-06",
    "amount": 1499.00,
    "source": "nerdy-checkout"
  }'`;

const jsExample = `const res = await fetch(
  "${ENDPOINT}",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: \`Bearer \${process.env.GATEKEEPR_API_KEY}\`,
    },
    body: JSON.stringify({
      transaction_ref: "TXN-2026-00482",
      business_name: "Nerdy",
      external_user_id: "user_8821",
      date: "2026-05-06",
      amount: 1499.0,
      source: "nerdy-checkout",
    }),
  },
);

const data = await res.json();
if (data.verified) {
  // unlock service
} else {
  // handle data.reason: "not_found" | "amount_mismatch" | ...
}`;

const pythonExample = `import os, requests

res = requests.post(
    "${ENDPOINT}",
    headers={"Authorization": f"Bearer {os.environ['GATEKEEPR_API_KEY']}"},
    json={
        "transaction_ref": "TXN-2026-00482",
        "business_name": "Nerdy",
        "external_user_id": "user_8821",
        "date": "2026-05-06",
        "amount": 1499.00,
        "source": "nerdy-checkout",
    },
    timeout=15,
)
data = res.json()
print(data)`;

const successResponse = `{
  "verified": true,
  "transaction": {
    "ref": "TXN-2026-00482",
    "amount": 1499.00,
    "currency": "USD",
    "occurred_at": "2026-05-06T10:24:11.000Z",
    "project_code": "GK-2026-0007"
  }
}`;

const failResponse = `{ "verified": false, "reason": "not_found" }`;

function ApiDocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <header className="mb-8 border-b border-border pb-6">
        <div className="text-xs uppercase tracking-wider text-muted-foreground">Developers</div>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Payment Verification API</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Public endpoint that lets partner sites confirm a payment matches a transaction recorded
          in Gatekeepr, and stamp it with the verifier's business identity.
        </p>
      </header>

      <nav className="mb-10 rounded-lg border border-border bg-card p-4 text-sm">
        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          On this page
        </div>
        <ul className="grid grid-cols-2 gap-y-1">
          {[
            ["overview", "Overview"],
            ["endpoint", "Endpoint"],
            ["body", "Request body"],
            ["examples", "Examples"],
            ["responses", "Responses"],
            ["effects", "Side effects"],
            ["matching", "Matching rules"],
            ["security", "Security notes"],
          ].map(([id, label]) => (
            <li key={id}>
              <a href={`#${id}`} className="text-primary hover:underline">
                {label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <Section id="overview" title="Overview">
        <p>
          Partner applications (e.g. Nerdy) call this endpoint with a transaction reference they
          received from an end user. If Gatekeepr has a matching record, the API returns{" "}
          <Inline>verified: true</Inline>, stamps the transaction with the partner's business name,
          and updates the linked project's last-payment fields.
        </p>
      </Section>

      <Section id="endpoint" title="Endpoint">
        <CopyBlock code={`POST ${ENDPOINT}`} language="http" />
        <p>Also accepts <Inline>OPTIONS</Inline> for CORS preflight. CORS is open (<Inline>*</Inline>).</p>
        <p>
          <strong>Auth:</strong> required. Send a Gatekeepr-issued bearer token in the{" "}
          <Inline>Authorization</Inline> header:
        </p>
        <CopyBlock code={`Authorization: Bearer YOUR_API_KEY`} language="http" />
        <p>
          Manage tokens in <Inline>Admin → API Keys</Inline>. The full token is shown only
          once at creation; revoking takes effect immediately.
        </p>
        <p>
          <strong>Rate limit:</strong> 30 requests / minute / IP. Exceeding returns{" "}
          <Inline>429 {`{"error":"rate_limited"}`}</Inline>.
        </p>
      </Section>

      <Section id="body" title="Request body (JSON)">
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
              {[
                ["transaction_ref", "string (1–120)", "Yes", "Transaction ID. Case-insensitive match."],
                ["business_name", "string (1–160)", "Yes", "Caller's business name. Stored on transaction."],
                ["external_user_id", "string (≤160)", "No", "Caller's internal user ID, for cross-reference."],
                ["date", "ISO date / datetime", "No", "If set, must match transaction's UTC day."],
                ["amount", "number ≥ 0", "No", "If set, must equal recorded amount exactly."],
                ["source", "string (≤160)", "No", "Free-form audit label, e.g. 'nerdy-checkout'."],
              ].map(([f, t, r, n]) => (
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
      </Section>

      <Section id="examples" title="Examples">
        <h3 className="mt-2 text-sm font-medium">cURL</h3>
        <CopyBlock code={curlExample} language="bash" />
        <h3 className="mt-4 text-sm font-medium">JavaScript / TypeScript</h3>
        <CopyBlock code={jsExample} language="ts" />
        <h3 className="mt-4 text-sm font-medium">Python</h3>
        <CopyBlock code={pythonExample} language="python" />
      </Section>

      <Section id="responses" title="Responses">
        <h3 className="text-sm font-medium">200 — Verified</h3>
        <CopyBlock code={successResponse} language="json" />

        <h3 className="mt-4 text-sm font-medium">200 — Not verified</h3>
        <CopyBlock code={failResponse} language="json" />
        <p>Possible <Inline>reason</Inline> values:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li><Inline>not_found</Inline> — no transaction with that ref.</li>
          <li><Inline>date_mismatch</Inline> — provided date doesn't match recorded UTC day.</li>
          <li><Inline>amount_mismatch</Inline> — provided amount differs from recorded amount.</li>
          <li><Inline>invalid_date</Inline> — date couldn't be parsed.</li>
        </ul>

        <h3 className="mt-4 text-sm font-medium">Errors</h3>
        <ul className="ml-5 list-disc space-y-1">
          <li><Inline>401 {`{"error":"missing_api_key"}`}</Inline> — no <Inline>Authorization: Bearer …</Inline> header.</li>
          <li><Inline>401 {`{"error":"invalid_api_key"}`}</Inline> — token is unknown or revoked.</li>
          <li><Inline>400 {`{"error":"invalid_json"}`}</Inline> — body isn't valid JSON.</li>
          <li><Inline>400 {`{"error":"invalid_body","issues":[...]}`}</Inline> — Zod validation failed.</li>
          <li><Inline>429 {`{"error":"rate_limited"}`}</Inline> — too many requests from this IP.</li>
          <li><Inline>500 {`{"verified":false,"reason":"lookup_error"}`}</Inline> — DB error.</li>
        </ul>
      </Section>

      <Section id="effects" title="Side effects on success">
        <ol className="ml-5 list-decimal space-y-1">
          <li>
            The matched transaction is updated with <Inline>verified_external_name</Inline>,{" "}
            <Inline>verified_external_user_id</Inline>, <Inline>verified_source</Inline>, and{" "}
            <Inline>verified_at</Inline>. Latest verification wins.
          </li>
          <li>
            If linked to a project, the project's <Inline>last_transaction_ref</Inline> and{" "}
            <Inline>last_payment_at</Inline> are updated.
          </li>
          <li>The response includes <Inline>project_code</Inline> for correlation.</li>
        </ol>
      </Section>

      <Section id="matching" title="Matching rules">
        <ul className="ml-5 list-disc space-y-1">
          <li><Inline>transaction_ref</Inline> — case-insensitive, otherwise exact.</li>
          <li><Inline>date</Inline> — compared as calendar day in UTC.</li>
          <li><Inline>amount</Inline> — strict numeric equality.</li>
          <li>Only <Inline>transaction_ref</Inline> and <Inline>business_name</Inline> are required; the rest are optional safety checks.</li>
        </ul>
      </Section>

      <Section id="security" title="Security notes">
        <ul className="ml-5 list-disc space-y-1">
          <li>Endpoint is intentionally public — never send secrets in the body.</li>
          <li><Inline>business_name</Inline> is asserted, not authenticated. Use as audit, not auth.</li>
          <li>
            Need stronger trust? An <Inline>x-api-key</Inline> per-partner scheme can be added on
            request.
          </li>
        </ul>
      </Section>
    </div>
  );
}
