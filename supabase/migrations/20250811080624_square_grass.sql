/*
  # Storage RLS Policies for CV Uploads

  1. Security
    - Enable RLS on storage.objects
    - Allow authenticated users to manage their own CV files
    - Restrict access to cvs/{auth.uid()}/* path pattern

  2. Policies
    - INSERT: Users can upload to their own folder
    - SELECT: Users can read their own files
    - UPDATE: Users can update their own files  
    - DELETE: Users can delete their own files
*/

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can upload CVs to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own CVs" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own CVs" ON storage.objects;

-- INSERT policy: Users can upload to cvs/{auth.uid()}/* in resumes bucket
CREATE POLICY "Users can upload CVs to their own folder"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'resumes' 
    AND (storage.foldername(name))[1] = 'cvs'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- SELECT policy: Users can view their own CVs
CREATE POLICY "Users can view their own CVs"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = 'cvs'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );

-- UPDATE policy: Users can update their own CVs
CREATE POLICY "Users can update their own CVs"
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

-- DELETE policy: Users can delete their own CVs
CREATE POLICY "Users can delete their own CVs"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'resumes'
    AND (storage.foldername(name))[1] = 'cvs'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );