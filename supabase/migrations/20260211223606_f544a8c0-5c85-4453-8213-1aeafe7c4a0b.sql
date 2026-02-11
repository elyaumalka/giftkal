
-- Add RSVP fields to guests table
ALTER TABLE public.guests 
ADD COLUMN rsvp_status text NOT NULL DEFAULT 'pending',
ADD COLUMN rsvp_date timestamp with time zone,
ADD COLUMN number_of_guests integer NOT NULL DEFAULT 1;
