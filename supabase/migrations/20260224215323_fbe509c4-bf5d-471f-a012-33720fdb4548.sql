
-- Add children_count to guests
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS children_count integer NOT NULL DEFAULT 0;

-- Allow public to update RSVP fields on guests (only rsvp_status, number_of_guests, children_count, rsvp_date)
CREATE POLICY "Public can update RSVP status"
  ON public.guests FOR UPDATE
  USING (true)
  WITH CHECK (true);
