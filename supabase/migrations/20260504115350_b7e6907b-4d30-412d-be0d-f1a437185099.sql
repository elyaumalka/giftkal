
DROP VIEW IF EXISTS public.public_events;

CREATE VIEW public.public_events
WITH (security_invoker=off) AS
SELECT 
    id,
    event_type,
    event_date,
    groom_name,
    bride_name,
    child_name,
    family_name,
    bride_parents,
    groom_parents,
    bride_grandparents,
    groom_grandparents,
    ceremony_time,
    reception_time,
    invitation_text,
    invitation_design_url,
    invitation_notes,
    voice_text,
    custom_venue_name,
    custom_venue_location,
    venue_id,
    hall_id,
    gifts_enabled,
    rsvp_enabled,
    invitations_enabled,
    seller_payme_id
FROM events;
