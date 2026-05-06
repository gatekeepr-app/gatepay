-- 1. Function to generate a unique 6-char pay code (no ambiguous chars)
CREATE OR REPLACE FUNCTION public.generate_pay_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..6 LOOP
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.projects WHERE pay_code = code);
  END LOOP;
  RETURN code;
END;
$$;

-- 2. Add pay_code column to projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS pay_code text UNIQUE;

-- Backfill existing rows
UPDATE public.projects SET pay_code = public.generate_pay_code() WHERE pay_code IS NULL;

-- Set default for new rows
ALTER TABLE public.projects
  ALTER COLUMN pay_code SET DEFAULT public.generate_pay_code(),
  ALTER COLUMN pay_code SET NOT NULL;

-- 3. Allow anyone to look up a project by its pay_code (public pay page needs this)
CREATE POLICY "public read projects for pay page"
ON public.projects FOR SELECT
TO anon
USING (true);

CREATE POLICY "public read project billing for pay page"
ON public.project_billing FOR SELECT
TO anon
USING (true);

-- 4. Allow anon to read transactions for a project (to compute what's already paid)
CREATE POLICY "public read transactions for pay page"
ON public.transactions FOR SELECT
TO anon
USING (project_id IS NOT NULL);

-- 5. Drop the old payment_links table — replaced by static project pay codes
DROP TABLE IF EXISTS public.payment_links CASCADE;

-- 6. Replace the old anon insert policy on transactions to allow inserts when project exists
DROP POLICY IF EXISTS "anon submit transaction via payment link" ON public.transactions;

CREATE POLICY "anon submit transaction for project"
ON public.transactions FOR INSERT
TO anon
WITH CHECK (
  project_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = transactions.project_id)
);