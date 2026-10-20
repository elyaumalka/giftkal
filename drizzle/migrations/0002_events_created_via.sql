ALTER TABLE public.events ADD COLUMN IF NOT EXISTS created_via text;
CREATE INDEX IF NOT EXISTS idx_events_created_via ON public.events(created_via);