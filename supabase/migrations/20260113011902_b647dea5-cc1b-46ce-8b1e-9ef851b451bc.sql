-- Allow public read access to events for gift page
CREATE POLICY "Public can view events for gift" 
ON public.events 
FOR SELECT 
USING (true);

-- Allow public read access to venues for gift page
CREATE POLICY "Public can view venues" 
ON public.venues 
FOR SELECT 
USING (true);