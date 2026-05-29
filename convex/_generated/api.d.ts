/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as api_keys from "../api_keys.js";
import type * as api_logs from "../api_logs.js";
import type * as auth from "../auth.js";
import type * as billing from "../billing.js";
import type * as clients from "../clients.js";
import type * as invitations from "../invitations.js";
import type * as invoices from "../invoices.js";
import type * as leads from "../leads.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_crypto from "../lib/crypto.js";
import type * as lib_helpers from "../lib/helpers.js";
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
  analytics: typeof analytics;
  api_keys: typeof api_keys;
  api_logs: typeof api_logs;
  auth: typeof auth;
  billing: typeof billing;
  clients: typeof clients;
  invitations: typeof invitations;
  invoices: typeof invoices;
  leads: typeof leads;
  "lib/auth": typeof lib_auth;
  "lib/crypto": typeof lib_crypto;
  "lib/helpers": typeof lib_helpers;
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
