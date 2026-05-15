import { z } from "zod";

/**
 * sanitizeText — normalize and strip dangerous/invisible characters from
 * any free-form text input before it is validated or stored.
 *
 * Note: Supabase JS uses parameterized queries, so this is NOT what protects
 * against SQL injection — that's already handled. This focuses on:
 *   - Unicode normalization (NFKC) so visually-similar chars become canonical
 *   - Removing control chars, zero-width chars, BOM, and bidi overrides
 *     (commonly abused for spoofing / homograph attacks)
 *   - Stripping HTML tags so stored text is plain text
 *   - Collapsing runs of whitespace
 */
export function sanitizeText(input: string): string {
  return input
    .normalize("NFKC")
    // strip ASCII control chars (NUL, etc.) but keep \t \n \r
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    // strip zero-width, BOM, bidi overrides, and other invisible formatting chars
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, "")
    // strip HTML tags so stored text stays plain text
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")
    // collapse internal whitespace runs to a single space
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

// Reusable primitives
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

// Public lead / contact form
export const leadSchema = z.object({
  name: safeText(100).pipe(z.string().min(1, { message: "Name is required" })),
  email: emailSchema,
  company: safeText(150).optional(),
  message: safeText(2000).pipe(z.string().min(1, { message: "Message is required" })),
});
export type LeadInput = z.infer<typeof leadSchema>;

// Public payment submission
export const paymentSubmissionSchema = z.object({
  payer_name: safeText(100).pipe(z.string().min(1, { message: "Your name is required" })),
  method: z.enum(["bKash", "Nagad", "Rocket", "Bank transfer", "Card", "Other"]),
  // Transaction refs are alphanumeric across bKash/Nagad/banks; allow dash/underscore.
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

// Login
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Pay code from URL
export const payCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6}$/, { message: "Invalid payment code" });

// Invite token from URL (24 random bytes -> 48 hex chars)
export const inviteTokenSchema = z
  .string()
  .trim()
  .regex(/^[a-f0-9]{16,128}$/i, { message: "Invalid invitation token" });
