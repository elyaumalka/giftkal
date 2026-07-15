
CREATE INDEX IF NOT EXISTS idx_events_event_date_desc ON public.events (event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_venue_id ON public.events (venue_id);
CREATE INDEX IF NOT EXISTS idx_events_created_by_partner_id ON public.events (created_by_partner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_event_id ON public.transactions (event_id);
CREATE INDEX IF NOT EXISTS idx_transactions_venue_id ON public.transactions (venue_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions (created_at DESC);
ANALYZE public.events;
ANALYZE public.transactions;
