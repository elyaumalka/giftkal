
-- 1. Drop the overly permissive anon SELECT policy on events
DROP POLICY IF EXISTS "Public can view events for gift" ON public.events;

-- 2. Recreate public_events view WITHOUT security_invoker (runs as owner, bypasses RLS)
-- Excludes: hf_api_key, payment_setup_data, payment_setup_status, owner_id, 
-- share_token_*, device_*, documents_complete, payment_completed, total_budget, budget_enabled
DROP VIEW IF EXISTS public.public_events;

CREATE VIEW public.public_events AS
SELECT 
  id, event_type, event_date,
  groom_name, bride_name, child_name, family_name,
  bride_parents, groom_parents, bride_grandparents, groom_grandparents,
  ceremony_time, reception_time,
  invitation_text, invitation_design_url, invitation_notes, voice_text,
  custom_venue_name, custom_venue_location,
  venue_id, hall_id,
  gifts_enabled, rsvp_enabled, invitations_enabled,
  seller_payme_id
FROM public.events;

-- Grant anon and authenticated access to the view
GRANT SELECT ON public.public_events TO anon;
GRANT SELECT ON public.public_events TO authenticated;

-- 3. Create a security definer function to look up event by share token
-- This avoids exposing share_token columns to anon users
CREATE OR REPLACE FUNCTION public.lookup_event_by_share_token(_token text)
RETURNS TABLE (
  id uuid,
  event_type text,
  event_date date,
  groom_name text,
  bride_name text,
  child_name text,
  family_name text,
  custom_venue_name text,
  custom_venue_location text,
  side text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    e.id, e.event_type, e.event_date,
    e.groom_name, e.bride_name, e.child_name, e.family_name,
    e.custom_venue_name, e.custom_venue_location,
    CASE 
      WHEN e.share_token_groom = _token THEN 'groom'
      WHEN e.share_token_bride = _token THEN 'bride'
      WHEN e.share_token_general = _token THEN 'general'
    END as side
  FROM public.events e
  WHERE e.share_token_groom = _token 
     OR e.share_token_bride = _token 
     OR e.share_token_general = _token
  LIMIT 1;
$$;

-- Grant execute to anon and authenticated
GRANT EXECUTE ON FUNCTION public.lookup_event_by_share_token(text) TO anon;
GRANT EXECUTE ON FUNCTION public.lookup_event_by_share_token(text) TO authenticated;
