
-- Add share tokens to events for public invitation links
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS share_token_groom text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  ADD COLUMN IF NOT EXISTS share_token_bride text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
  ADD COLUMN IF NOT EXISTS share_token_general text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');

-- Add side column to guests to differentiate groom/bride sides
ALTER TABLE public.guests
  ADD COLUMN IF NOT EXISTS side text NOT NULL DEFAULT 'general';

-- Allow public insert to guests via share token (validated in app)
CREATE POLICY "Public can insert guests via share token"
  ON public.guests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = guests.event_id
      AND (
        events.share_token_groom IS NOT NULL
        OR events.share_token_bride IS NOT NULL
        OR events.share_token_general IS NOT NULL
      )
    )
  );

-- Allow public to read guests by event_id (for shared pages)
CREATE POLICY "Public can view guests for shared events"
  ON public.guests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = guests.event_id
      AND (
        events.share_token_groom IS NOT NULL
        OR events.share_token_bride IS NOT NULL
        OR events.share_token_general IS NOT NULL
      )
    )
  );
