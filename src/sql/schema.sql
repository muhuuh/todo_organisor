
-- Create UUID extension if it doesn't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table for email verification (if not using Supabase Auth UI)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

-- Create or replace trigger to update profiles.updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  sub_task TEXT NOT NULL,
  main_task TEXT,
  category TEXT NOT NULL,
  importance TEXT NOT NULL CHECK (importance IN ('Low', 'Medium', 'High')),
  time_estimate INTEGER,
  bucket TEXT NOT NULL CHECK (bucket IN ('Short-Term', 'Mid-Term', 'Long-Term', 'Today', 'Tomorrow', 'This Week')),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create an update trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_tasks_bucket ON tasks(bucket);
CREATE INDEX IF NOT EXISTS idx_tasks_is_archived ON tasks(is_archived);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);
CREATE INDEX IF NOT EXISTS idx_tasks_importance ON tasks(importance);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);

-- Add Row Level Security (RLS) policies
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop the public policies if they exist
DROP POLICY IF EXISTS "Public can read tasks" ON tasks;
DROP POLICY IF EXISTS "Public can insert tasks" ON tasks;
DROP POLICY IF EXISTS "Public can update tasks" ON tasks;
DROP POLICY IF EXISTS "Public can delete tasks" ON tasks;

-- Create RLS policies for authenticated users
CREATE POLICY "Users can read their own tasks" 
ON tasks FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tasks" 
ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tasks" 
ON tasks FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tasks" 
ON tasks FOR DELETE USING (auth.uid() = user_id);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can read only their own profile"
ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update only their own profile"
ON profiles FOR UPDATE USING (auth.uid() = id);

-- Enable Supabase auth hooks to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set up the trigger to call the function on user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
