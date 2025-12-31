-- Add sort_order column for stable task ranking
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'tasks'
        AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE tasks
        ADD COLUMN sort_order INTEGER DEFAULT EXTRACT(EPOCH FROM NOW())::INT;
    END IF;
END $$;

-- Backfill sort_order for existing tasks (per user and bucket)
WITH ordered AS (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY user_id, bucket ORDER BY created_at) AS new_order
    FROM tasks
)
UPDATE tasks
SET sort_order = ordered.new_order
FROM ordered
WHERE tasks.id = ordered.id;

-- Ensure sort_order is never null
UPDATE tasks
SET sort_order = EXTRACT(EPOCH FROM NOW())::INT
WHERE sort_order IS NULL;
