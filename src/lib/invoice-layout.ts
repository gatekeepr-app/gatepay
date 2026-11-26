import type { JSONContent } from "@tiptap/core";

export const DEFAULT_INVOICE_LOGO_WIDTH_MM = 42;
export const DEFAULT_INVOICE_LOGO_ALIGNMENT = "center" as const;

export type InvoiceLogoAlignment = "left" | "center" | "right";

export type InvoiceFooterDocument = JSONContent & {
  type: "doc";
};

export const emptyInvoiceFooterDocument: InvoiceFooterDocument = {
  type: "doc",
  content: [{ type: "paragraph" }],
};

export function legacyFooterToDocument(footer: string): InvoiceFooterDocument {
  const paragraphs = footer
    .split(/\r?\n/)
    .map((line) => ({ type: "paragraph", content: line ? [{ type: "text", text: line }] : undefined }));

  return {
    type: "doc",
    content: paragraphs.length ? paragraphs : emptyInvoiceFooterDocument.content,
  };
}

export function parseInvoiceFooterDocument(
  serialized: string | null | undefined,
  legacyFooter = "",
): InvoiceFooterDocument {
  if (serialized) {
    try {
      const parsed: unknown = JSON.parse(serialized);
      if (parsed && typeof parsed === "object" && "type" in parsed && parsed.type === "doc") {
        return parsed as InvoiceFooterDocument;
      }
    } catch {
      // Fall back to the legacy plain-text footer for old or invalid settings.
    }
  }

  return legacyFooterToDocument(legacyFooter);
}
