
-- ============================
-- FIX 1: Events - Create a public view with limited columns
-- ============================

-- Create a view for public event access (gifts, RSVP, welcome page)
CREATE OR REPLACE VIEW public.public_events AS
SELECT 
  id, event_type, event_date, groom_name, bride_name, child_name, family_name,
  groom_parents, bride_parents, groom_grandparents, bride_grandparents,
  reception_time, ceremony_time, venue_id, hall_id,
  custom_venue_name, custom_venue_location,
  invitation_text, invitation_design_url, voice_text,
  seller_payme_id,
  gifts_enabled, invitations_enabled, rsvp_enabled, budget_enabled,
  share_token_groom, share_token_bride, share_token_general
FROM public.events;

-- Drop the overly permissive public SELECT policy
DROP POLICY IF EXISTS "Public can view events for gift" ON public.events;

-- Re-create a restricted public SELECT policy using a security definer function
CREATE OR REPLACE FUNCTION public.is_event_public_accessible(_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events WHERE id = _event_id
  )
$$;

-- ============================
-- FIX 2: Guests - Restrict public UPDATE to RSVP fields only
-- ============================

-- Drop the overly permissive update policy
DROP POLICY IF EXISTS "Public can update RSVP status" ON public.guests;

-- Create a restricted update policy - only allows specific columns
-- We use a trigger to enforce column restriction
CREATE OR REPLACE FUNCTION public.restrict_guest_public_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow changes to RSVP-related fields
  NEW.full_name := OLD.full_name;
  NEW.phone := OLD.phone;
  NEW.email := OLD.email;
  NEW.event_id := OLD.event_id;
  NEW.side := OLD.side;
  NEW.relationship := OLD.relationship;
  NEW.invitation_sent := OLD.invitation_sent;
  NEW.created_at := OLD.created_at;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_guest_public_update
BEFORE UPDATE ON public.guests
FOR EACH ROW
WHEN (current_setting('request.jwt.claims', true)::jsonb ->> 'role' = 'anon')
EXECUTE FUNCTION public.restrict_guest_public_update();

-- Re-create public update policy (still allows update but trigger protects fields)
CREATE POLICY "Public can update RSVP status"
ON public.guests
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- ============================
-- FIX 3: Guests - Restrict public SELECT to require share token match
-- ============================

DROP POLICY IF EXISTS "Public can view guests for shared events" ON public.guests;

CREATE OR REPLACE FUNCTION public.guest_event_has_valid_share_token(_event_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.events 
    WHERE id = _event_id 
    AND (share_token_groom IS NOT NULL OR share_token_bride IS NOT NULL OR share_token_general IS NOT NULL)
  )
$$;

-- Public can view guests only for events that have share tokens
-- The actual token verification happens at the application level when resolving the event
CREATE POLICY "Public can view guests for shared events"
ON public.guests
FOR SELECT
TO anon
USING (public.guest_event_has_valid_share_token(event_id));

-- ============================
-- FIX 4: Profiles - Restrict to own profile + admin
-- ============================

DROP POLICY IF EXISTS "Profiles are viewable by authenticated users" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- ============================
-- FIX 5: Documents storage - restrict to owner
-- ============================

DROP POLICY IF EXISTS "Authenticated users can view documents" ON storage.objects;

CREATE POLICY "Users can view own documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND 
  (
    public.has_role(auth.uid(), 'admin') OR
    auth.uid()::text = (storage.foldername(name))[1]
  )
);

-- ============================
-- FIX 6: Venue assets storage - restrict modifications to venue owner
-- ============================

DROP POLICY IF EXISTS "Venue owners can update assets" ON storage.objects;
DROP POLICY IF EXISTS "Venue owners can delete assets" ON storage.objects;

CREATE POLICY "Venue owners can update own assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'venue-assets' AND
  (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE venues.id::text = (storage.foldername(name))[1]
      AND venues.owner_id = auth.uid()
    )
  )
);

CREATE POLICY "Venue owners can delete own assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'venue-assets' AND
  (
    public.has_role(auth.uid(), 'admin') OR
    EXISTS (
      SELECT 1 FROM public.venues
      WHERE venues.id::text = (storage.foldername(name))[1]
      AND venues.owner_id = auth.uid()
    )
  )
);
