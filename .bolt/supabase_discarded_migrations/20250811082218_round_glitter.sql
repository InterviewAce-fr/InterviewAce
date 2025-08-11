/*
  # Storage RLS Policies for Resumes Bucket

  1. Security Policies
    - CREATE policies for INSERT/SELECT/UPDATE/DELETE on storage.objects
    - Restrict access to cvs/{auth.uid()}/ path pattern in 'resumes' bucket
    - Idempotent creation using DO blocks with pg_policies check

  Note: If policy creation fails due to permissions, create these policies 
  manually via Supabase Dashboard → Storage → Policies and remove this migration.
*/

-- INSERT policy: Users can upload files to their own cvs folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can upload to own cvs folder'
  ) THEN
    CREATE POLICY "Users can upload to own cvs folder"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'resumes' 
        AND storage.foldername(name)[1] = 'cvs' 
        AND storage.foldername(name)[2] = auth.uid()::text
      );
  END IF;
END $$;

-- SELECT policy: Users can view their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can view own files'
  ) THEN
    CREATE POLICY "Users can view own files"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'resumes' 
        AND storage.foldername(name)[1] = 'cvs' 
        AND storage.foldername(name)[2] = auth.uid()::text
      );
  END IF;
END $$;

-- UPDATE policy: Users can update their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update own files'
  ) THEN
    CREATE POLICY "Users can update own files"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'resumes' 
        AND storage.foldername(name)[1] = 'cvs' 
        AND storage.foldername(name)[2] = auth.uid()::text
      )
      WITH CHECK (
        bucket_id = 'resumes' 
        AND storage.foldername(name)[1] = 'cvs' 
        AND storage.foldername(name)[2] = auth.uid()::text
      );
  END IF;
END $$;

-- DELETE policy: Users can delete their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete own files'
  ) THEN
    CREATE POLICY "Users can delete own files"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'resumes' 
        AND storage.foldername(name)[1] = 'cvs' 
        AND storage.foldername(name)[2] = auth.uid()::text
      );
  END IF;
END $$;