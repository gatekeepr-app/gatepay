import { escapeHtml } from "./text";

export function buildPaymentConfirmedEmail(payment: {
  transactionRef: string;
  amount: number;
  currency: string;
  projectName?: string;
  projectCode?: string;
  period?: string;
  transactionId: string;
  verifiedAt?: number;
}) {
  const projectName = payment.projectName ?? "GatePay";
  const verifiedAt = payment.verifiedAt
    ? `<tr><td style="padding:8px 0;color:#888;">Verified at</td><td style="padding:8px 0;">${new Date(payment.verifiedAt).toLocaleDateString()}</td></tr>`
    : "";
  const period = payment.period
    ? `<tr><td style="padding:8px 0;color:#888;">Period</td><td style="padding:8px 0;">${escapeHtml(payment.period)}</td></tr>`
    : "";
  const project = payment.projectName
    ? `<tr><td style="padding:8px 0;color:#888;">Project</td><td style="padding:8px 0;">${escapeHtml(payment.projectName)}${payment.projectCode ? ` (${payment.projectCode})` : ""}</td></tr>`
    : "";

  return {
    subject: `Payment Confirmed — ${escapeHtml(projectName)}`,
    html: `<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px;">
      <h2 style="margin:0 0 16px;font-size:20px;">Payment Confirmed</h2>
      <p style="color:#555;margin:0 0 24px;">Your payment has been verified by our team.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:8px 0;color:#888;">Transaction ref</td><td style="padding:8px 0;font-family:monospace;">${escapeHtml(payment.transactionRef)}</td></tr>
        <tr><td style="padding:8px 0;color:#888;">Amount</td><td style="padding:8px 0;">${escapeHtml(payment.currency)} ${payment.amount.toLocaleString()}</td></tr>
        ${period}
        ${project}
        ${verifiedAt}
      </table>
      <p style="margin:24px 0 0;"><a href="https://pay.darvizlabs.com/receipt/${payment.transactionId}" style="display:inline-block;background:#111;color:#fff;padding:12px 24px;border-radius:9999px;text-decoration:none;font-size:14px;font-weight:500;">View Receipt</a></p>
      <p style="color:#888;font-size:12px;margin:24px 0 0;">GatePay — Payment Verification</p>
    </div>`,
  };
}
