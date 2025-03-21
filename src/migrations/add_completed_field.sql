-- Add the completed field to the tasks table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'tasks' 
        AND column_name = 'completed'
    ) THEN
        ALTER TABLE tasks 
        ADD COLUMN completed BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Update existing records to set completed to false
UPDATE tasks 
SET completed = FALSE 
WHERE completed IS NULL;

-- Add a comment explaining the migration
COMMENT ON COLUMN tasks.completed IS 'Indicates whether the subtask has been completed'; 