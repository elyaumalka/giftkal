-- Partner commission model: extra markup on top of platform fees for partner-referred events.
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS partner_commission_pct numeric NOT NULL DEFAULT 3.0,
  ADD COLUMN IF NOT EXISTS platform_commission_pct numeric NOT NULL DEFAULT 2.0;

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS partner_share numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS platform_partner_share numeric NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_transactions_partner_id ON public.transactions(partner_id);