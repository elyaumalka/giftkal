-- Create a table for landing page leads
CREATE TABLE public.landing_page_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  event_date DATE,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.landing_page_leads ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a lead (from the public landing page)
CREATE POLICY "Anyone can submit leads" 
ON public.landing_page_leads 
FOR INSERT 
WITH CHECK (true);

-- Venue owners can view leads for their venue
CREATE POLICY "Venue owners can view their leads" 
ON public.landing_page_leads 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::user_role) OR 
  EXISTS (
    SELECT 1 FROM venues 
    WHERE venues.id = landing_page_leads.venue_id 
    AND venues.owner_id = auth.uid()
  )
);

-- Venue owners can update their leads
CREATE POLICY "Venue owners can update their leads" 
ON public.landing_page_leads 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::user_role) OR 
  EXISTS (
    SELECT 1 FROM venues 
    WHERE venues.id = landing_page_leads.venue_id 
    AND venues.owner_id = auth.uid()
  )
);

-- Venue owners can delete their leads
CREATE POLICY "Venue owners can delete their leads" 
ON public.landing_page_leads 
FOR DELETE 
USING (
  has_role(auth.uid(), 'admin'::user_role) OR 
  EXISTS (
    SELECT 1 FROM venues 
    WHERE venues.id = landing_page_leads.venue_id 
    AND venues.owner_id = auth.uid()
  )
);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_landing_page_leads_updated_at
BEFORE UPDATE ON public.landing_page_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();