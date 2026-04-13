-- Drop triggers first
DROP TRIGGER IF EXISTS guest_insert_webhook ON public.guests;
DROP TRIGGER IF EXISTS guest_update_webhook ON public.guests;

-- Now drop the function
DROP FUNCTION IF EXISTS public.notify_guest_webhook();
