-- Create task_goals table for per-user goal minutes
CREATE TABLE IF NOT EXISTS task_goals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('main', 'subtask')),
  goal_key TEXT NOT NULL,
  goal_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, goal_type, goal_key)
);

-- Keep updated_at current
DROP TRIGGER IF EXISTS update_task_goals_updated_at ON task_goals;
CREATE TRIGGER update_task_goals_updated_at
BEFORE UPDATE ON task_goals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_task_goals_user_id ON task_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_task_goals_type ON task_goals(goal_type);

-- RLS policies
ALTER TABLE task_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own goals" ON task_goals;
DROP POLICY IF EXISTS "Users can insert their own goals" ON task_goals;
DROP POLICY IF EXISTS "Users can update their own goals" ON task_goals;
DROP POLICY IF EXISTS "Users can delete their own goals" ON task_goals;

CREATE POLICY "Users can read their own goals"
ON task_goals FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own goals"
ON task_goals FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own goals"
ON task_goals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own goals"
ON task_goals FOR DELETE USING (auth.uid() = user_id);
