CREATE TABLE IF NOT EXISTS public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  seller_payme_id text,
  amount numeric,
  currency text NOT NULL DEFAULT 'ILS',
  partial_transaction_ids jsonb,
  status text NOT NULL DEFAULT 'submitted',
  failure_reason text,
  requested_by uuid,
  approved_by uuid,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
GRANT SELECT ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view payouts" ON public.payouts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Owners view own payouts" ON public.payouts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.events e WHERE e.id = event_id AND e.owner_id = auth.uid()));