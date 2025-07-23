/*
  # Create preparations table for interview preparation data

  1. New Tables
    - `preparations`
      - `id` (uuid, primary key) - Unique identifier for each preparation
      - `user_id` (uuid, foreign key) - References auth.users.id
      - `title` (text) - Title of the interview preparation
      - `job_url` (text) - URL of the job posting (optional)
      - `created_at` (timestamptz) - When the preparation was created
      - `updated_at` (timestamptz) - When the preparation was last updated
      - `is_complete` (boolean) - Whether the preparation is marked as complete
      - `step_1_data` (jsonb) - Job analysis data
      - `step_2_data` (jsonb) - Business model data
      - `step_3_data` (jsonb) - SWOT analysis data
      - `step_4_data` (jsonb) - Profile matching data
      - `step_5_data` (jsonb) - Why questions data
      - `step_6_data` (jsonb) - Interview questions data

  2. Security
    - Enable RLS on `preparations` table
    - Add policies for authenticated users to manage their own preparations
    - Users can only access preparations they own

  3. Indexes
    - Index on user_id for efficient queries
    - Index on updated_at for sorting
*/

-- Create the preparations table
CREATE TABLE IF NOT EXISTS preparations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  job_url text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  is_complete boolean NOT NULL DEFAULT false,
  step_1_data jsonb NOT NULL DEFAULT '{}',
  step_2_data jsonb NOT NULL DEFAULT '{}',
  step_3_data jsonb NOT NULL DEFAULT '{}',
  step_4_data jsonb NOT NULL DEFAULT '{}',
  step_5_data jsonb NOT NULL DEFAULT '{}',
  step_6_data jsonb NOT NULL DEFAULT '{}'
);

-- Enable Row Level Security
ALTER TABLE preparations ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS preparations_user_id_idx ON preparations(user_id);
CREATE INDEX IF NOT EXISTS preparations_updated_at_idx ON preparations(updated_at DESC);

-- Create RLS policies
CREATE POLICY "Users can view their own preparations"
  ON preparations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preparations"
  ON preparations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preparations"
  ON preparations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own preparations"
  ON preparations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at on row changes
CREATE TRIGGER update_preparations_updated_at
  BEFORE UPDATE ON preparations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();