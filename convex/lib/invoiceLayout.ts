export const DEFAULT_INVOICE_LOGO_WIDTH_MM = 42;
export const DEFAULT_INVOICE_LOGO_ALIGNMENT = "center" as const;
export const MIN_INVOICE_LOGO_WIDTH_MM = 20;
export const MAX_INVOICE_LOGO_WIDTH_MM = 80;

const allowedChildren: Record<string, Set<string>> = {
  doc: new Set(["paragraph", "bulletList", "orderedList"]),
  paragraph: new Set(["text", "hardBreak"]),
  bulletList: new Set(["listItem"]),
  orderedList: new Set(["listItem"]),
  listItem: new Set(["paragraph", "bulletList", "orderedList"]),
  hardBreak: new Set(),
  text: new Set(),
};

const allowedMarks = new Set(["bold", "italic"]);
const allowedTypes = new Set(Object.keys(allowedChildren));

export function validateInvoiceFooterContent(serialized: string): void {
  if (serialized.length > 12_000) throw new Error("Invoice footer content is too long");

  let document: unknown;
  try {
    document = JSON.parse(serialized);
  } catch {
    throw new Error("Invoice footer content is invalid");
  }

  let nodeCount = 0;
  const visit = (candidate: unknown, parentType: string | null, depth: number): void => {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      throw new Error("Invoice footer content is invalid");
    }

    const node = candidate as {
      type?: unknown;
      text?: unknown;
      attrs?: unknown;
      marks?: unknown;
      content?: unknown;
    };
    if (typeof node.type !== "string" || !allowedTypes.has(node.type)) {
      throw new Error("Invoice footer contains an unsupported element");
    }
    if (parentType && !allowedChildren[parentType]?.has(node.type)) {
      throw new Error("Invoice footer has an invalid structure");
    }
    nodeCount += 1;
    if (nodeCount > 500 || depth > 8) throw new Error("Invoice footer is too complex");

    if (node.type === "text") {
      if (typeof node.text !== "string" || node.text.length > 4_000) {
        throw new Error("Invoice footer text is invalid");
      }
    } else if (node.text !== undefined) {
      throw new Error("Invoice footer content is invalid");
    }

    if (node.attrs !== undefined && node.attrs !== null) {
      const attrs = node.attrs as Record<string, unknown>;
      if (node.type !== "orderedList" || Object.keys(attrs).some((key) => key !== "start")) {
        throw new Error("Invoice footer attributes are invalid");
      }
      if (attrs.start !== undefined && (typeof attrs.start !== "number" || !Number.isInteger(attrs.start) || attrs.start < 1 || attrs.start > 1_000)) {
        throw new Error("Invoice footer list start is invalid");
      }
    }

    if (node.marks !== undefined) {
      if (node.type !== "text" || !Array.isArray(node.marks)) {
        throw new Error("Invoice footer formatting is invalid");
      }
      for (const mark of node.marks) {
        if (!mark || typeof mark !== "object" || Array.isArray(mark)) {
          throw new Error("Invoice footer formatting is invalid");
        }
        const record = mark as { type?: unknown; attrs?: unknown };
        if (typeof record.type !== "string" || !allowedMarks.has(record.type) || record.attrs !== undefined) {
          throw new Error("Invoice footer contains unsupported formatting");
        }
      }
    }

    if (node.content !== undefined) {
      if (!Array.isArray(node.content)) throw new Error("Invoice footer content is invalid");
      for (const child of node.content) visit(child, node.type, depth + 1);
    }
  };

  if (!document || typeof document !== "object" || Array.isArray(document) || (document as { type?: unknown }).type !== "doc") {
    throw new Error("Invoice footer must be a document");
  }
  visit(document, null, 0);
}
