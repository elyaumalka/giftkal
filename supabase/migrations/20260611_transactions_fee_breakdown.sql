-- Track the gross-up breakdown per transaction.
--
-- Until now `transactions.amount` was the gift amount the guest typed. With
-- gross-up enabled it represents the TOTAL charged on the card. To keep both
-- numbers — what the couple intends to receive vs what we actually billed —
-- we add two explicit columns:
--
--   gift_amount  = amount the couple gets (what they "feel" as the gift)
--   fee_amount   = the gross-up surcharge (gross_charge - gift_amount)
--
-- Both are nullable so historical rows from before this migration stay valid.
-- New rows (written by payme-charge-token and payme-generate-link) populate
-- both; the admin wallet panel reads them to compute "how much commission can
-- I sweep right now".

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS gift_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS fee_amount NUMERIC(12,2);

-- Backfill: for transactions that pre-date the gross-up rollout we treat the
-- existing amount AS the gift amount (because back then the guest was typing
-- the gift, fees came out of it). Going forward those rows just won't have a
-- fee_amount to sweep, which is correct — that money already went to the
-- couple's wallet.
UPDATE public.transactions
SET gift_amount = amount, fee_amount = 0
WHERE gift_amount IS NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_event_status
  ON public.transactions(event_id, payment_status);
