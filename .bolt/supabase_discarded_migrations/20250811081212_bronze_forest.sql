/*
  # Storage RLS Policies for Resumes Bucket

  1. Security
    - Enable RLS on storage.objects
    - Add policies for authenticated users to manage their own CV files
    - Restrict access to cvs/{auth.uid()}/* path pattern

  2. Policies
    - INSERT: Users can upload to their own folder
    - SELECT: Users can read their own files
    - UPDATE: Users can update their own files
    - DELETE: Users can delete their own files
*/

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy for INSERT (upload) - users can upload to their own cvs folder
CREATE POLICY "Users can upload CVs to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' 
  AND (storage.foldername(name))[1] = 'cvs' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy for SELECT (download/read) - users can read their own files
CREATE POLICY "Users can read their own CV files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' 
  AND (storage.foldername(name))[1] = 'cvs' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy for UPDATE - users can update their own files
CREATE POLICY "Users can update their own CV files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'resumes' 
  AND (storage.foldername(name))[1] = 'cvs' 
  AND (storage.foldername(name))[2] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'resumes' 
  AND (storage.foldername(name))[1] = 'cvs' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Policy for DELETE - users can delete their own files
CREATE POLICY "Users can delete their own CV files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' 
  AND (storage.foldername(name))[1] = 'cvs' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);