-- Allow admins to delete events
CREATE POLICY "Admin can delete events"
ON public.events
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::user_role));
