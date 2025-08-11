/*
  # Fix users mapping to Supabase Auth

  1. Schema Updates
    - Add auth_user_id column to public.users if missing
    - Create unique index on auth_user_id
    
  2. Functions
    - Create ensure_user() function to link auth users to public users
    
  3. Security
    - Function uses security definer to access auth.users
    - Proper error handling for missing auth context
*/

-- Add auth_user_id column if missing
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- Create unique index if not exists
CREATE UNIQUE INDEX IF NOT EXISTS users_auth_user_id_key ON public.users(auth_user_id);

-- Create or replace ensure_user function
CREATE OR REPLACE FUNCTION public.ensure_user()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  uid uuid := auth.uid();
  u_id uuid;
  u_email text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'no auth.uid()';
  END IF;
  
  SELECT id INTO u_id FROM public.users WHERE auth_user_id = uid;
  
  IF u_id IS NULL THEN
    SELECT email INTO u_email FROM auth.users WHERE id = uid;
    
    INSERT INTO public.users (auth_user_id, email)
    VALUES (uid, u_email)
    RETURNING id INTO u_id;
  END IF;
  
  RETURN u_id;
END;
$$;