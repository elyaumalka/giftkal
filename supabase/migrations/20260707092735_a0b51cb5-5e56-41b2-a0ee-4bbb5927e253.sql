
-- Partners
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_email text,
  webhook_url text,
  webhook_secret text,
  webhook_events text[] NOT NULL DEFAULT ARRAY[]::text[],
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.partners TO authenticated;
GRANT ALL ON public.partners TO service_role;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage partners" ON public.partners
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::user_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::user_role));

CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Webhook deliveries log
CREATE TABLE public.partner_webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb,
  signature text,
  response_status int,
  response_body text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.partner_webhook_deliveries TO authenticated;
GRANT ALL ON public.partner_webhook_deliveries TO service_role;
ALTER TABLE public.partner_webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view webhook deliveries" ON public.partner_webhook_deliveries
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::user_role));

CREATE INDEX idx_partner_deliveries_partner ON public.partner_webhook_deliveries(partner_id, created_at DESC);

-- Link api_keys and events to a partner
ALTER TABLE public.api_keys
  ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS created_by_partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL;
