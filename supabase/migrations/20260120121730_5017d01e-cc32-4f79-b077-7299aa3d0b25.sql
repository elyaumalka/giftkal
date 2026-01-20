-- Add PayMe seller ID to events table for marketplace payments
ALTER TABLE public.events 
ADD COLUMN seller_payme_id text;

-- Add PayMe transaction tracking columns to transactions table
ALTER TABLE public.transactions 
ADD COLUMN payme_sale_id text,
ADD COLUMN payme_transaction_id text,
ADD COLUMN payment_status text DEFAULT 'pending';

-- Create index for faster PayMe lookups
CREATE INDEX idx_transactions_payme_sale_id ON public.transactions(payme_sale_id);
CREATE INDEX idx_events_seller_payme_id ON public.events(seller_payme_id);

-- Add comment for documentation
COMMENT ON COLUMN public.events.seller_payme_id IS 'PayMe seller ID for the event owner - used for marketplace payments';
COMMENT ON COLUMN public.transactions.payme_sale_id IS 'PayMe sale ID returned from generate-sale API';
COMMENT ON COLUMN public.transactions.payme_transaction_id IS 'PayMe transaction ID from callback';
COMMENT ON COLUMN public.transactions.payment_status IS 'Payment status: pending, completed, failed, refunded';