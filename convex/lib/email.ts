export const RESEND_API_KEY = process.env.RESEND_API_KEY;
export const EMAIL_FROM = "GatePay <pay@mail.darvizlabs.online>";

export function sendEmail(to: string | string[], subject: string, html: string) {
  return fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: EMAIL_FROM, to, subject, html }),
  });
}
