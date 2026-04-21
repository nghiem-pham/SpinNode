-- Safely add display_name column for databases created by ddl-auto
-- that may have the table but not this column.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'users' AND column_name = 'display_name'
    ) THEN
        ALTER TABLE users ADD COLUMN display_name VARCHAR(255) NOT NULL DEFAULT '';
    END IF;
END
$$;
