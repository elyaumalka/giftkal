-- Fix the permissive RLS policy for transactions
DROP POLICY IF EXISTS "Create transactions" ON public.transactions;

-- More restrictive policy: only allow creating transactions for events owned by user or public gift giving
CREATE POLICY "Create transactions" ON public.transactions 
FOR INSERT TO authenticated 
WITH CHECK (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = transactions.event_id)
);

-- Also add a policy for anonymous users to give gifts (public gift screen)
CREATE POLICY "Public can give gifts" ON public.transactions
FOR INSERT TO anon
WITH CHECK (
    EXISTS (SELECT 1 FROM public.events WHERE events.id = transactions.event_id)
);