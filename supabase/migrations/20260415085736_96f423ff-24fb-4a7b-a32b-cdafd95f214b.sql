CREATE POLICY "Allow anonymous lead submissions"
ON public.leads
FOR INSERT
TO anon, authenticated
WITH CHECK (true);