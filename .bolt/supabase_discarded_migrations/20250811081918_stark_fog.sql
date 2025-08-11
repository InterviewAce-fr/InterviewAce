/*
  # Storage RLS Policies for Resumes Bucket

  1. Security Policies
    - CREATE policies for storage.objects bucket 'resumes'
    - Restrict access to cvs/{auth.uid()}/... path pattern
    - Covers INSERT, SELECT, UPDATE, DELETE operations

  Note: RLS is already enabled on storage.objects by default in Supabase.
  If policy creation fails due to permissions, create these policies manually
  via Supabase Dashboard → Storage → Policies.
*/

-- INSERT policy: Users can upload to their own folder
CREATE POLICY "Users can upload to own folder in resumes bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'resumes' 
  AND (storage.foldername(name))[1] = 'cvs' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- SELECT policy: Users can view their own files
CREATE POLICY "Users can view own files in resumes bucket"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'resumes' 
  AND (storage.foldername(name))[1] = 'cvs' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- UPDATE policy: Users can update their own files
CREATE POLICY "Users can update own files in resumes bucket"
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

-- DELETE policy: Users can delete their own files
CREATE POLICY "Users can delete own files in resumes bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'resumes' 
  AND (storage.foldername(name))[1] = 'cvs' 
  AND (storage.foldername(name))[2] = auth.uid()::text
);