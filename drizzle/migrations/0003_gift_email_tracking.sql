ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS receipt_email_sent_at timestamptz;
CREATE TABLE IF NOT EXISTS public.gift_summary_runs (
  run_date date PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now(),
  owners_sent integer NOT NULL DEFAULT 0,
  admin_sent boolean NOT NULL DEFAULT false
);
GRANT ALL ON public.gift_summary_runs TO service_role;
GRANT SELECT ON public.gift_summary_runs TO authenticated;
ALTER TABLE public.gift_summary_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view summary runs" ON public.gift_summary_runs FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::user_role));