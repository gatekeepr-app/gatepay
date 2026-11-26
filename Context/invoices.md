# Invoice workflow

Invoices are managed from the admin workspace at `/admin/invoices`.

## Create and edit

1. Open **New invoice** and add a project, line items, tax, notes, and an optional due date.
2. Review the live document preview as you make changes.
3. Form changes autosave as a Draft after one second without input. The page shows the save state.
4. Choose **Save draft** to keep the invoice in Draft and open its details, or **Generate invoice** to save it and change its status to Sent.
5. Draft invoices can be reopened with **Edit invoice** on their details page. Edits continue to autosave.

The invoice reference can be entered manually or suggested from the rules configured in **Admin → Settings → Brand**. Brand settings also control the business details, uploaded logo, and footer used in previews and invoice documents.

## Due dates and status

Set a due date in the invoice form or add/change it from the invoice details page. The due date appears in the invoice preview and PDF.

The invoice details page provides a status selector for Draft, Sent, Paid, Overdue, and Inactive. Only Sent and Overdue invoices accept payments through the public invoice-payment form. Paid, Draft, and Inactive invoices remain searchable by reference but cannot accept payment submissions.

## PDF export

Use the download icon beside an invoice on `/admin/invoices`. GatePay opens a print-ready A4 document using the saved invoice and brand data. In the browser print dialog, select **Save as PDF** to download the file.

## Client payment lookup

Clients can open `/payment`, enter an invoice reference or project code, and choose **Find**. Sent or Overdue invoices show their amount and line items. The client submits a bKash transaction ID and name; the submission is recorded as pending until an admin verifies it.

Project payment links at `/pay/:code` are a separate flow from invoice-reference lookup.
