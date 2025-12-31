-- Add completed_at timestamp for accurate completion tracking
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
