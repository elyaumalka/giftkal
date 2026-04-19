-- Add kiosk access codes to halls and venues
ALTER TABLE public.halls ADD COLUMN IF NOT EXISTS kiosk_access_code TEXT UNIQUE;
ALTER TABLE public.venues ADD COLUMN IF NOT EXISTS kiosk_access_code TEXT UNIQUE;

-- Generate codes for existing rows (6-character uppercase)
UPDATE public.halls SET kiosk_access_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT), 1, 6)) WHERE kiosk_access_code IS NULL;
UPDATE public.venues SET kiosk_access_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT || id::TEXT), 1, 6)) WHERE kiosk_access_code IS NULL;

-- Default for new rows
ALTER TABLE public.halls ALTER COLUMN kiosk_access_code SET DEFAULT UPPER(SUBSTRING(MD5(RANDOM()::TEXT || gen_random_uuid()::TEXT), 1, 6));
ALTER TABLE public.venues ALTER COLUMN kiosk_access_code SET DEFAULT UPPER(SUBSTRING(MD5(RANDOM()::TEXT || gen_random_uuid()::TEXT), 1, 6));

-- Public lookup function for kiosk launcher (security definer to bypass RLS for this controlled lookup)
CREATE OR REPLACE FUNCTION public.lookup_by_kiosk_code(_code text)
RETURNS TABLE(entity_type text, entity_id uuid, name text, venue_id uuid, venue_name text)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 'hall'::text, h.id, h.name, h.venue_id, v.name
  FROM public.halls h JOIN public.venues v ON v.id = h.venue_id
  WHERE h.kiosk_access_code = UPPER(_code) AND h.is_active = true
  UNION ALL
  SELECT 'venue'::text, v.id, v.name, v.id, v.name
  FROM public.venues v
  WHERE v.kiosk_access_code = UPPER(_code)
  LIMIT 1;
$$;