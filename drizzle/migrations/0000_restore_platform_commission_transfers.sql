CREATE TABLE IF NOT EXISTS public.platform_commission_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL CHECK (status IN ('submitted','completed','failed','cancelled')) DEFAULT 'submitted',
  failure_reason TEXT,
  payme_sale_id TEXT,
  payme_transaction_id TEXT,
  initiated_by UUID,
  source_transaction_ids JSONB,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_commission_transfers_event ON public.platform_commission_transfers(event_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_commission_transfers TO authenticated;
GRANT ALL ON public.platform_commission_transfers TO service_role;
ALTER TABLE public.platform_commission_transfers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins manage commission transfers" ON public.platform_commission_transfers;
CREATE POLICY "Admins manage commission transfers" ON public.platform_commission_transfers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));