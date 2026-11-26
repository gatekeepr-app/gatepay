import { hmacSha256 } from "./crypto";

export const WEBHOOK_RETRY_DELAYS = [60_000, 300_000, 900_000] as const;

export async function buildSignedWebhookRequest(input: {
  event: "verified" | "reimbursed";
  businessName: string;
  transactions: unknown[];
  signingSecret?: string;
}) {
  const payload = {
    event: input.event,
    businessName: input.businessName,
    sentAt: new Date().toISOString(),
    transactions: input.transactions,
  };
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "User-Agent": "GatePay-Verify/1.0",
  };

  if (input.signingSecret) {
    const signature = await hmacSha256(input.signingSecret, body);
    headers["X-GatePay-Signature"] = `sha256=${signature}`;
  }

  return { body, headers };
}
