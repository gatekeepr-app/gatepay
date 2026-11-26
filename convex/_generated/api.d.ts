/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_logs from "../admin_logs.js";
import type * as analytics from "../analytics.js";
import type * as api_keys from "../api_keys.js";
import type * as api_logs from "../api_logs.js";
import type * as auth from "../auth.js";
import type * as billing from "../billing.js";
import type * as brand from "../brand.js";
import type * as clients from "../clients.js";
import type * as crons from "../crons.js";
import type * as invitations from "../invitations.js";
import type * as invoices from "../invoices.js";
import type * as leads from "../leads.js";
import type * as lib_adminAuditLog from "../lib/adminAuditLog.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_billing from "../lib/billing.js";
import type * as lib_crypto from "../lib/crypto.js";
import type * as lib_email from "../lib/email.js";
import type * as lib_invoiceReference from "../lib/invoiceReference.js";
import type * as lib_paymentEmail from "../lib/paymentEmail.js";
import type * as lib_projectCodes from "../lib/projectCodes.js";
import type * as lib_text from "../lib/text.js";
import type * as lib_validators from "../lib/validators.js";
import type * as lib_webhooks from "../lib/webhooks.js";
import type * as overdue from "../overdue.js";
import type * as projects from "../projects.js";
import type * as public_ from "../public.js";
import type * as rate_limit from "../rate_limit.js";
import type * as refunds from "../refunds.js";
import type * as seed from "../seed.js";
import type * as transactions from "../transactions.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin_logs: typeof admin_logs;
  analytics: typeof analytics;
  api_keys: typeof api_keys;
  api_logs: typeof api_logs;
  auth: typeof auth;
  billing: typeof billing;
  brand: typeof brand;
  clients: typeof clients;
  crons: typeof crons;
  invitations: typeof invitations;
  invoices: typeof invoices;
  leads: typeof leads;
  "lib/adminAuditLog": typeof lib_adminAuditLog;
  "lib/auth": typeof lib_auth;
  "lib/billing": typeof lib_billing;
  "lib/crypto": typeof lib_crypto;
  "lib/email": typeof lib_email;
  "lib/invoiceReference": typeof lib_invoiceReference;
  "lib/paymentEmail": typeof lib_paymentEmail;
  "lib/projectCodes": typeof lib_projectCodes;
  "lib/text": typeof lib_text;
  "lib/validators": typeof lib_validators;
  "lib/webhooks": typeof lib_webhooks;
  overdue: typeof overdue;
  projects: typeof projects;
  public: typeof public_;
  rate_limit: typeof rate_limit;
  refunds: typeof refunds;
  seed: typeof seed;
  transactions: typeof transactions;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
