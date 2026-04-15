
-- Venue owners need to see profiles of event owners linked to their venue
CREATE POLICY "Venue owners can view related profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.events e
    JOIN public.venues v ON v.id = e.venue_id
    WHERE e.owner_id = profiles.user_id
    AND v.owner_id = auth.uid()
  )
);
