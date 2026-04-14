CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_amount numeric NOT NULL DEFAULT 50,
  description text,
  is_active boolean DEFAULT true,
  max_uses integer,
  current_uses integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage coupons" ON public.coupons
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Anyone can read active coupons for validation" ON public.coupons
  FOR SELECT TO public
  USING (is_active = true);

INSERT INTO public.coupons (code, discount_amount, description) VALUES
  ('YESHIVA50', 50, 'הנחה לישיבות ותתי"ם'),
  ('GIFTKAL50', 50, 'קופון הנחה כללי');