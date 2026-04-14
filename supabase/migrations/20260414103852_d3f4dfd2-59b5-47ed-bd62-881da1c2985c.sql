
ALTER TABLE public.events
ADD COLUMN payment_setup_status text DEFAULT NULL,
ADD COLUMN payment_setup_data jsonb DEFAULT NULL;
