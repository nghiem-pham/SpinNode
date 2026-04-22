-- Drop the old "username" column left over from the original ddl-auto schema.
-- The entity now uses "display_name" instead.
ALTER TABLE users DROP COLUMN IF EXISTS username;
