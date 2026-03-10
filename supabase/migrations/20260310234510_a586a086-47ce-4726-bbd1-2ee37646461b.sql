
-- Create halls table (physical halls under venues)
CREATE TABLE public.halls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES public.venues(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  default_message TEXT DEFAULT 'ברוכים הבאים',
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add hall_id to events
ALTER TABLE public.events ADD COLUMN hall_id UUID REFERENCES public.halls(id) ON DELETE SET NULL;

-- Add hall_id to devices
ALTER TABLE public.devices ADD COLUMN hall_id UUID REFERENCES public.halls(id) ON DELETE SET NULL;

-- Enable RLS on halls
ALTER TABLE public.halls ENABLE ROW LEVEL SECURITY;

-- RLS: Public can view halls (for kiosk page)
CREATE POLICY "Public can view halls" ON public.halls
  FOR SELECT TO public USING (true);

-- RLS: Venue owners and admins can manage halls
CREATE POLICY "Manage halls" ON public.halls
  FOR ALL TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::user_role) OR
    EXISTS (SELECT 1 FROM venues WHERE venues.id = halls.venue_id AND venues.owner_id = auth.uid())
  )
  WITH CHECK (
    has_role(auth.uid(), 'admin'::user_role) OR
    EXISTS (SELECT 1 FROM venues WHERE venues.id = halls.venue_id AND venues.owner_id = auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER update_halls_updated_at
  BEFORE UPDATE ON public.halls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
