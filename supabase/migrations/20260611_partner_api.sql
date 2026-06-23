-- Partner API support — lets external systems (e.g. an RSVP-management
-- vendor) create their own events under giftkal and process payments via
-- giftkal's PayMe pipeline. Each partner gets:
--   - A row in `partners` with a webhook URL + HMAC secret.
--   - One or more API keys (api_keys.partner_id NOT NULL).
--   - Scoped visibility — they only see resources they created.
--
-- Resources created via a partner-scoped API key are tagged with
-- created_by_partner_id so the scoping is enforced uniformly across events,
-- profiles, and (later) anything else partners can touch.

CREATE TABLE IF NOT EXISTS public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  /* Where to POST webhook payloads. NULL = partner hasn't subscribed yet. */
  webhook_url TEXT,
  /* HMAC-SHA256 secret used to sign webhook payloads. Generated server-side. */
  webhook_secret TEXT,
  /* Whitelist of notify_type strings the partner wants to receive. NULL/empty
     = no events. We don't push everything by default to avoid surprising
     partners with payloads they aren't ready for. */
  webhook_events TEXT[] DEFAULT ARRAY[]::TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partners_is_active ON public.partners(is_active);

-- Link API keys to partners. Existing rows stay partner_id=NULL → they're
-- treated as internal admin keys that see everything (current behavior).
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS partner_id UUID REFERENCES public.partners(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_api_keys_partner ON public.api_keys(partner_id);

-- Tag created resources with the partner that created them. NULL means
-- created via the dashboard (not a partner).
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS created_by_partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS created_by_partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_partner ON public.events(created_by_partner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_partner ON public.profiles(created_by_partner_id);

-- Append-only audit log of every webhook delivery attempt. Partners can read
-- their own log via the API if they need to debug missed events.
CREATE TABLE IF NOT EXISTS public.partner_webhook_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  signature TEXT,
  /* HTTP status code returned by the partner; NULL = no response (network err). */
  response_status INTEGER,
  response_body TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  delivered_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_deliveries_partner_time
  ON public.partner_webhook_deliveries(partner_id, delivered_at DESC);

-- RLS — only admins manage partners; partner_webhook_deliveries is admin-only too.
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_webhook_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage partners" ON public.partners;
CREATE POLICY "Admins manage partners" ON public.partners
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins read partner deliveries" ON public.partner_webhook_deliveries;
CREATE POLICY "Admins read partner deliveries" ON public.partner_webhook_deliveries
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Convenience function: hash a plaintext API key the same way the edge
-- function does. Useful when the admin wants to insert/lookup a key from
-- SQL without rebuilding the SHA-256 chain manually.
CREATE OR REPLACE FUNCTION public.hash_api_key(plaintext TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT encode(extensions.digest(plaintext, 'sha256'), 'hex');
$$;

COMMENT ON TABLE public.partners IS 'External B2B clients (e.g. RSVP vendors) that build on top of giftkal.';
COMMENT ON COLUMN public.api_keys.partner_id IS 'NULL = internal/admin key; non-NULL = scoped to a partner.';
COMMENT ON COLUMN public.events.created_by_partner_id IS 'Set when the event was created via a partner-scoped API key.';
