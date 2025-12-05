-- Create message-files storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-files', 'message-files', true);

-- Storage policy: Allow authenticated users to upload files
CREATE POLICY "Users can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policy: Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'message-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policy: Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-files' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Storage policy: Allow public read access
CREATE POLICY "Public read access"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'message-files');
