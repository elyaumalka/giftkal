CREATE TABLE public.guest_invitation_sends (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_id uuid NOT NULL REFERENCES public.guests(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email','whatsapp')),
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed','queued')),
  recipient text,
  error_message text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_gis_event ON public.guest_invitation_sends(event_id);
CREATE INDEX idx_gis_guest ON public.guest_invitation_sends(guest_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.guest_invitation_sends TO authenticated;
GRANT ALL ON public.guest_invitation_sends TO service_role;

ALTER TABLE public.guest_invitation_sends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event owners manage their invitation sends"
ON public.guest_invitation_sends FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.owner_id = auth.uid()))
WITH CHECK (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.owner_id = auth.uid()));

CREATE POLICY "Venue owners view their invitation sends"
ON public.guest_invitation_sends FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.events e JOIN public.venues v ON v.id = e.venue_id
  WHERE e.id = event_id AND v.owner_id = auth.uid()
));

CREATE POLICY "Admins manage all invitation sends"
ON public.guest_invitation_sends FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_guest_invitation_sends_updated_at
BEFORE UPDATE ON public.guest_invitation_sends
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS invitation_sent_at timestamp with time zone;
ALTER TABLE public.guests ADD COLUMN IF NOT EXISTS invitation_last_channel text;