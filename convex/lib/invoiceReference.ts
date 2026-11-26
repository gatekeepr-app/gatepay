import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type ReadContext = QueryCtx | MutationCtx;
type ReferenceScope = "global" | "project";

export const invoiceReferenceDefaults = {
  prefix: "TLS",
  monthCodes: "JA,FE,MR,AP,MY,JN,JL,AU,SP,OC,NO,DE",
  seriesPrefix: "AA",
  pattern: "{prefix}-{yy}{month}{project}-{series}{index}",
  sequenceScope: "project" as const,
};

const REFERENCE_TOKENS = ["prefix", "yy", "month", "project", "series", "index"] as const;

export function validateReferencePattern(value: string): string {
  const pattern = value.trim() || invoiceReferenceDefaults.pattern;
  const tokens = [...pattern.matchAll(/\{([^}]+)\}/g)].map((match) => match[1]);
  if (
    !tokens.includes("index") ||
    pattern.length > 100 ||
    tokens.some((token) => !REFERENCE_TOKENS.includes(token as (typeof REFERENCE_TOKENS)[number]))
  ) {
    throw new Error("Reference pattern must include {index}, use supported tokens, and be 100 characters or fewer");
  }
  return pattern;
}

type Settings = {
  referencePrefix?: string;
  referenceMonthCodes?: string;
  referenceSeriesPrefix?: string;
  referencePattern?: string;
  referenceSequenceScope?: ReferenceScope;
};

async function loadSettings(ctx: ReadContext): Promise<Settings> {
  const settings = await ctx.db
    .query("brandSettings")
    .withIndex("by_key", (q) => q.eq("key", "default"))
    .first();
  return settings ?? {};
}

function formatReference({
  settings,
  projectCode,
  issueDate,
  index,
}: {
  settings: Settings;
  projectCode?: string;
  issueDate: number;
  index: number;
}) {
  const date = new Date(issueDate);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const monthCodes = (settings.referenceMonthCodes ?? invoiceReferenceDefaults.monthCodes).split(",").map((code) => code.trim().toUpperCase());
  const projectSequence = projectCode?.match(/(\d+)$/)?.[1];
  const projectNumber = projectSequence ? String(Number(projectSequence)).padStart(2, "0") : "00";
  const values: Record<string, string> = {
    prefix: settings.referencePrefix?.trim().toUpperCase() || invoiceReferenceDefaults.prefix,
    yy: String(year).slice(-2),
    month: monthCodes[month] || String(month + 1).padStart(2, "0"),
    project: projectNumber,
    series: settings.referenceSeriesPrefix?.trim().toUpperCase() || invoiceReferenceDefaults.seriesPrefix,
    index: String(index),
  };
  const pattern = settings.referencePattern?.trim() || invoiceReferenceDefaults.pattern;
  const supportedTokens = REFERENCE_TOKENS.join("|");
  return pattern.replace(new RegExp(`\\{(${supportedTokens})\\}`, "g"), (_, token: string) => values[token]);
}

async function nextCandidate(
  ctx: ReadContext,
  projectId: Id<"projects"> | undefined,
  issueDate: number,
) {
  const settings = await loadSettings(ctx);
  const date = new Date(issueDate);
  const year = date.getUTCFullYear();
  const project = projectId ? await ctx.db.get(projectId) : null;
  const scopedProject = settings.referenceSequenceScope === "project" && projectId ? projectId : "global";
  const counterName = `invoice-reference-${year}-${scopedProject}`;
  const counter = await ctx.db.query("counters").withIndex("by_name", (q) => q.eq("name", counterName)).first();
  let index = counter?.value ?? 0;

  for (let attempt = 0; attempt < 100; attempt += 1) {
    index += 1;
    const reference = formatReference({ settings, projectCode: project?.projectCode, issueDate, index });
    const duplicate = await ctx.db
      .query("invoices")
      .withIndex("by_invoice_number", (q) => q.eq("invoiceNumber", reference))
      .first();
    if (!duplicate) return { counter, counterName, index, reference };
  }
  throw new Error("Could not find an unused invoice reference");
}

export async function getNextInvoiceReference(
  ctx: ReadContext,
  projectId: Id<"projects"> | undefined,
  issueDate: number,
) {
  return (await nextCandidate(ctx, projectId, issueDate)).reference;
}

export async function reserveNextInvoiceReference(
  ctx: MutationCtx,
  projectId: Id<"projects"> | undefined,
  issueDate: number,
) {
  const candidate = await nextCandidate(ctx, projectId, issueDate);
  if (candidate.counter) {
    await ctx.db.patch(candidate.counter._id, { value: candidate.index });
  } else {
    await ctx.db.insert("counters", { name: candidate.counterName, value: candidate.index });
  }
  return candidate.reference;
}
