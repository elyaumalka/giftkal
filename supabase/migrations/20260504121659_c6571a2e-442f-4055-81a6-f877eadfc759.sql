
CREATE POLICY "Anyone can upload blessings"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = 'blessings'
);

CREATE POLICY "Anyone can view blessings"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (
  bucket_id = 'documents' 
  AND (storage.foldername(name))[1] = 'blessings'
);
