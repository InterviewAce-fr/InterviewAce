/*
  # Create ensure_user function and update users table

  1. Updates
    - Add auth_user_id column to users table if missing
    - Create ensure_user() function to handle user creation
    - Function is security definer to access auth schema

  2. Security
    - Function runs with definer rights to access auth.users
    - Only authenticated users can call the function
    - Returns public.users.id for foreign key relationships
*/

-- Add auth_user_id column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'auth_user_id'
  ) THEN
    ALTER TABLE public.users ADD COLUMN auth_user_id uuid UNIQUE;
  END IF;
END $$;

-- Make auth_user_id NOT NULL if it's not already
DO $$
BEGIN
  -- First, update any existing rows that might have NULL auth_user_id
  UPDATE public.users 
  SET auth_user_id = id 
  WHERE auth_user_id IS NULL;
  
  -- Then make the column NOT NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'auth_user_id'
    AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE public.users ALTER COLUMN auth_user_id SET NOT NULL;
  END IF;
END $$;

-- Create or replace the ensure_user function
CREATE OR REPLACE FUNCTION public.ensure_user()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_auth_id uuid;
  user_record_id uuid;
  user_email text;
BEGIN
  -- Get the current authenticated user's ID
  current_auth_id := auth.uid();
  
  -- Check if user is authenticated
  IF current_auth_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated';
  END IF;
  
  -- Check if user already exists in public.users
  SELECT id INTO user_record_id
  FROM public.users
  WHERE auth_user_id = current_auth_id;
  
  -- If user exists, return their ID
  IF user_record_id IS NOT NULL THEN
    RETURN user_record_id;
  END IF;
  
  -- User doesn't exist, get their email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = current_auth_id;
  
  -- Insert new user record
  INSERT INTO public.users (auth_user_id, email, created_at, updated_at)
  VALUES (current_auth_id, user_email, now(), now())
  RETURNING id INTO user_record_id;
  
  RETURN user_record_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_user() TO authenticated;