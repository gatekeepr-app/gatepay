import { z } from "zod";

export function sanitizeText(input: string): string {
  return input
    .normalize("NFKC")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, "")
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

const safeText = (max: number) =>
  z
    .string()
    .transform(sanitizeText)
    .pipe(z.string().max(max, { message: `Must be ${max} characters or fewer` }));


export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Invalid email address" })
  .max(254, { message: "Email too long" });

export const passwordSchema = z
  .string()
  .min(8, { message: "Password must be at least 8 characters" })
  .max(128, { message: "Password too long" });

export const leadSchema = z.object({
  name: safeText(100).pipe(z.string().min(1, { message: "Name is required" })),
  email: emailSchema,
  company: safeText(150).optional(),
  message: safeText(2000).pipe(z.string().min(1, { message: "Message is required" })),
});
export type LeadInput = z.infer<typeof leadSchema>;

export const paymentSubmissionSchema = z.object({
  payer_name: safeText(100).pipe(z.string().min(1, { message: "Your name is required" })),
  method: z.enum(["bKash", "Nagad", "Rocket", "Bank transfer", "Card", "Other"]),
  transaction_ref: z
    .string()
    .trim()
    .min(4, { message: "Transaction reference is too short" })
    .max(64, { message: "Transaction reference is too long" })
    .regex(/^[A-Za-z0-9_\-]+$/, {
      message: "Reference can only contain letters, numbers, dashes, or underscores",
    }),
  notes: safeText(500).optional(),
});
export type PaymentSubmissionInput = z.infer<typeof paymentSubmissionSchema>;

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const payCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6}$/, { message: "Invalid payment code" });

export const inviteTokenSchema = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{16,128}$/i, { message: "Invalid invitation token" });
