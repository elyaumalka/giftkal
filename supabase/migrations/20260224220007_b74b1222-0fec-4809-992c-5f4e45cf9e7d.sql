
-- Budget categories managed by admin
CREATE TABLE public.budget_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text DEFAULT '💰',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.budget_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active categories" ON public.budget_categories
  FOR SELECT USING (true);

CREATE POLICY "Admin manage categories" ON public.budget_categories
  FOR ALL USING (has_role(auth.uid(), 'admin'::user_role));

-- Insert default categories
INSERT INTO public.budget_categories (name, icon, sort_order) VALUES
  ('אולם / גן אירועים', '🏛️', 1),
  ('קייטרינג / מנות', '🍽️', 2),
  ('צילום / וידאו', '📸', 3),
  ('די.ג׳יי / מוזיקה', '🎵', 4),
  ('עיצוב / פרחים', '💐', 5),
  ('שמלה / חליפה', '👗', 6),
  ('הזמנות / דפוס', '✉️', 7),
  ('רבנות / טקס', '💍', 8),
  ('הסעות', '🚌', 9),
  ('מתנות לאורחים', '🎁', 10),
  ('איפור / שיער', '💄', 11),
  ('אחר', '📋', 12);

-- Budget items per event
CREATE TABLE public.budget_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.budget_categories(id),
  category_name text NOT NULL,
  planned_amount numeric NOT NULL DEFAULT 0,
  actual_amount numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event owners manage their budget" ON public.budget_items
  FOR ALL USING (
    has_role(auth.uid(), 'admin'::user_role) OR
    EXISTS (SELECT 1 FROM events WHERE events.id = budget_items.event_id AND events.owner_id = auth.uid())
  );

CREATE POLICY "View budget items" ON public.budget_items
  FOR SELECT USING (
    has_role(auth.uid(), 'admin'::user_role) OR
    EXISTS (SELECT 1 FROM events WHERE events.id = budget_items.event_id AND events.owner_id = auth.uid())
  );

-- Add total_budget to events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS total_budget numeric DEFAULT 0;
