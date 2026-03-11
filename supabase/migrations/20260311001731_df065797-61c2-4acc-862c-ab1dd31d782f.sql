
-- Drop the existing update policy on events
DROP POLICY IF EXISTS "Update events" ON public.events;

-- Recreate with venue owner support
CREATE POLICY "Update events" ON public.events
FOR UPDATE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::user_role)
  OR owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM venues
    WHERE venues.id = events.venue_id
    AND venues.owner_id = auth.uid()
  )
);
