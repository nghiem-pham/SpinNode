-- Auto-fetched LeetCode challenges only store title, difficulty, and URL.
-- Make the content/stats fields optional so they can be left null.
ALTER TABLE challenges ALTER COLUMN description    DROP NOT NULL;
ALTER TABLE challenges ALTER COLUMN topics         DROP NOT NULL;
ALTER TABLE challenges ALTER COLUMN acceptance_rate DROP NOT NULL;
ALTER TABLE challenges ALTER COLUMN submissions_count DROP NOT NULL;
