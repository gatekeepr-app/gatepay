import type { ReactNode } from "react";
import type { InvoiceFooterDocument } from "@/lib/invoice-layout";

function renderNode(node: Record<string, unknown>, key: string): ReactNode {
  const content = Array.isArray(node.content)
    ? node.content.map((child, index) => renderNode(child as Record<string, unknown>, `${key}-${index}`))
    : null;
  switch (node.type) {
    case "doc": return <>{content}</>;
    case "paragraph": return <p key={key} className="mb-1 last:mb-0">{content}</p>;
    case "text": {
      let text: ReactNode = typeof node.text === "string" ? node.text : null;
      const marks = Array.isArray(node.marks) ? node.marks as Array<{ type?: string }> : [];
      marks.forEach((mark, index) => {
        if (mark.type === "bold") text = <strong key={`${key}-bold-${index}`}>{text}</strong>;
        if (mark.type === "italic") text = <em key={`${key}-italic-${index}`}>{text}</em>;
      });
      return <span key={key}>{text}</span>;
    }
    case "hardBreak": return <br key={key} />;
    case "bulletList": return <ul key={key} className="my-1 list-disc pl-5">{content}</ul>;
    case "orderedList": return <ol key={key} className="my-1 list-decimal pl-5">{content}</ol>;
    case "listItem": return <li key={key}>{content}</li>;
    default: return null;
  }
}

export function InvoiceFooterRenderer({ document }: { document: InvoiceFooterDocument }) {
  return <>{renderNode(document as Record<string, unknown>, "footer")}</>;
}
