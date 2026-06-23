-- Wallet / payout tracking for the marketplace fund-flow.
--
-- Conceptual model (confirmed with Elyau + PayMe):
--   1. A guest pays a gross-up amount on the gift screen. PayMe routes it into
--      the event-owner's PayMe wallet (less PayMe's processing fee, billed to
--      our master account).
--   2. After each sale (or in batches), an admin sweeps giftkal's commission
--      out of the event-owner's wallet into our master wallet via
--      payme-generate-transfer. That row goes in platform_commission_transfers.
--   3. After the event ends and PayMe's 6-business-day hold clears, an admin
--      (or the event owner self-service) requests a withdraw-balance to push
--      the remaining funds to the linked bank account. That row goes in payouts.
--
-- Both tables are append-only audit logs of what we asked PayMe to do plus the
-- webhook-confirmed outcome.

CREATE TABLE IF NOT EXISTS public.platform_commission_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  -- 'submitted'  = we made the API call but haven't seen a webhook yet
  -- 'completed'  = PayMe confirmed (either via API response or webhook)
  -- 'failed'     = PayMe rejected; failure_reason has details
  -- 'cancelled'  = manually voided by an admin
  status TEXT NOT NULL CHECK (status IN ('submitted','completed','failed','cancelled')) DEFAULT 'submitted',
  failure_reason TEXT,
  payme_sale_id TEXT,
  payme_transaction_id TEXT,
  initiated_by UUID REFERENCES auth.users(id),
  source_transaction_ids JSONB,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_commission_transfers_event ON public.platform_commission_transfers(event_id);
CREATE INDEX IF NOT EXISTS idx_commission_transfers_status ON public.platform_commission_transfers(status);

CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  -- Denormalized so the row is still useful if the event is deleted before
  -- the audit period ends.
  seller_payme_id TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ILS',
  -- Optional. Null = full balance withdrawal; non-null = partial withdrawal
  -- targeting specific guest transactions.
  partial_transaction_ids JSONB,
  amount NUMERIC(12,2),
  payme_payout_code TEXT,
  status TEXT NOT NULL CHECK (status IN ('submitted','completed','failed','cancelled')) DEFAULT 'submitted',
  failure_reason TEXT,
  note TEXT,
  requested_by UUID REFERENCES auth.users(id),
  approved_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payouts_event ON public.payouts(event_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_seller_payme_id ON public.payouts(seller_payme_id);

-- RLS — admins do everything, event owners can read/insert payouts for their
-- own events.

ALTER TABLE public.platform_commission_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage commission transfers" ON public.platform_commission_transfers;
CREATE POLICY "Admins manage commission transfers" ON public.platform_commission_transfers
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage payouts" ON public.payouts;
CREATE POLICY "Admins manage payouts" ON public.payouts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Event owners read own payouts" ON public.payouts;
CREATE POLICY "Event owners read own payouts" ON public.payouts
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = payouts.event_id AND e.owner_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Event owners request own payouts" ON public.payouts;
CREATE POLICY "Event owners request own payouts" ON public.payouts
  FOR INSERT TO authenticated
  WITH CHECK (
    requested_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.events e
      WHERE e.id = payouts.event_id AND e.owner_id = auth.uid()
    )
  );
