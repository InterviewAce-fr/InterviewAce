/*
  # Create user_profiles table

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `email` (text, unique, not null)
      - `is_premium` (boolean, default false)
      - `booster_used` (boolean, default false)
      - `created_at` (timestamp with time zone, default now())
      - `premium_activated_at` (timestamp with time zone, nullable)
      - `cv_url` (text, nullable)
      - `first_name` (text, nullable)
      - `last_name` (text, nullable)
      - `phone` (text, nullable)
      - `company` (text, nullable)
      - `job_title` (text, nullable)
      - `updated_at` (timestamp with time zone, default now())

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policy for users to view their own profile
    - Add policy for users to update their own profile
    - Add policy for users to create their own profile
    - Add policy for service role to manage profiles (for auth webhook)

  3. Triggers
    - Add trigger to update `updated_at` on row changes
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL UNIQUE,
    is_premium boolean DEFAULT FALSE NOT NULL,
    booster_used boolean DEFAULT FALSE NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    premium_activated_at timestamp with time zone,
    cv_url text,
    first_name text,
    last_name text,
    phone text,
    company text,
    job_title text
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can create their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to manage all profiles (for auth webhook)
CREATE POLICY "Service role can manage all profiles" ON public.user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON public.user_profiles(email);
CREATE INDEX IF NOT EXISTS user_profiles_is_premium_idx ON public.user_profiles(is_premium);

-- Create trigger function for updated_at if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add trigger to update updated_at column
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();