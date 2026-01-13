-- Create storage bucket for venue assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('venue-assets', 'venue-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to their venue folder
CREATE POLICY "Venue owners can upload assets"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'venue-assets' AND
  auth.role() = 'authenticated'
);

-- Allow public read access to venue assets
CREATE POLICY "Public can view venue assets"
ON storage.objects
FOR SELECT
USING (bucket_id = 'venue-assets');

-- Allow venue owners to update their assets
CREATE POLICY "Venue owners can update assets"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'venue-assets' AND
  auth.role() = 'authenticated'
);

-- Allow venue owners to delete their assets
CREATE POLICY "Venue owners can delete assets"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'venue-assets' AND
  auth.role() = 'authenticated'
);