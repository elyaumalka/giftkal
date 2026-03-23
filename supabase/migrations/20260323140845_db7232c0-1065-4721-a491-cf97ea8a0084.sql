
CREATE TABLE public.billing_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  owner_name text NOT NULL,
  venue_name text,
  event_name text,
  amount numeric NOT NULL,
  plan_name text,
  nedarim_transaction_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.billing_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage billing charges" ON public.billing_charges
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admin insert billing charges" ON public.billing_charges
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::user_role));
