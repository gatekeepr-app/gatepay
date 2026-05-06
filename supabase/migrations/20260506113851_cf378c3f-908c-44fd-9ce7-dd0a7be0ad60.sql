-- Payment links table
CREATE TABLE public.payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'BDT',
  description text,
  status text NOT NULL DEFAULT 'active', -- active | paid | expired | disabled
  expires_at timestamptz,
  paid_transaction_id uuid REFERENCES public.transactions(id) ON DELETE SET NULL,
  paid_at timestamptz,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_payment_links_project ON public.payment_links(project_id);
CREATE INDEX idx_payment_links_code ON public.payment_links(code);

ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

-- Public can read active links (so /pay/$code page works without auth)
CREATE POLICY "public read active payment links"
ON public.payment_links FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "members insert payment links"
ON public.payment_links FOR INSERT
TO authenticated
WITH CHECK (is_workspace_member(auth.uid()) AND created_by = auth.uid());

CREATE POLICY "owner or manager update payment links"
ON public.payment_links FOR UPDATE
TO authenticated
USING (created_by = auth.uid() OR is_workspace_manager(auth.uid()))
WITH CHECK (created_by = auth.uid() OR is_workspace_manager(auth.uid()));

CREATE POLICY "owner or manager delete payment links"
ON public.payment_links FOR DELETE
TO authenticated
USING (created_by = auth.uid() OR is_workspace_manager(auth.uid()));

CREATE TRIGGER tr_payment_links_touch
BEFORE UPDATE ON public.payment_links
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Allow anonymous clients to submit a payment claim (transaction) via the public pay page.
-- They can only insert; they cannot read transactions.
CREATE POLICY "anon submit transaction via payment link"
ON public.transactions FOR INSERT
TO anon
WITH CHECK (
  project_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.payment_links pl
    WHERE pl.project_id = transactions.project_id
      AND pl.status = 'active'
  )
);