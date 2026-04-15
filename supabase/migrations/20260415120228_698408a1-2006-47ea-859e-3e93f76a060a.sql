
-- Re-add a public SELECT policy for events (needed for gift flow, RSVP, event welcome)
-- The view public_events limits columns, but direct queries are also needed
-- We add the policy back but the sensitive data protection comes from the application layer
-- and the restricted storage/profile policies we already added
CREATE POLICY "Public can view events for gift"
ON public.events
FOR SELECT
TO anon
USING (true);
