ALTER TABLE public.events
ADD COLUMN gifts_enabled boolean DEFAULT false,
ADD COLUMN invitations_enabled boolean DEFAULT false,
ADD COLUMN rsvp_enabled boolean DEFAULT false;
