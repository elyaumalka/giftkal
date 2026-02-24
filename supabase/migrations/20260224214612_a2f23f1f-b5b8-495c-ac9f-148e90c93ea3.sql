
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS reception_time text,
  ADD COLUMN IF NOT EXISTS ceremony_time text,
  ADD COLUMN IF NOT EXISTS child_name text,
  ADD COLUMN IF NOT EXISTS family_name text,
  ADD COLUMN IF NOT EXISTS invitation_notes text,
  ADD COLUMN IF NOT EXISTS voice_text text,
  ADD COLUMN IF NOT EXISTS custom_venue_name text,
  ADD COLUMN IF NOT EXISTS custom_venue_location text;
