
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS callback_url text,
  ADD COLUMN IF NOT EXISTS signing_secret text;

CREATE INDEX IF NOT EXISTS api_keys_business_name_lower_idx
  ON public.api_keys (lower(business_name));
