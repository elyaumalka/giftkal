
-- Fix the security definer view warning
DROP VIEW IF EXISTS public.public_events;

CREATE VIEW public.public_events
WITH (security_invoker = on)
AS
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
