ALTER TABLE public.events ADD COLUMN kyc_docs_status text DEFAULT NULL;
-- null = no docs needed or not relevant
-- 'pending' = docs uploaded, waiting admin approval
-- 'approved' = docs sent to PayMe successfully