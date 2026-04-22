-- Remove duplicate users introduced by seed migrations,
-- keeping the row with the lowest id for each email.
DELETE FROM users
WHERE id NOT IN (
  SELECT MIN(id) FROM users GROUP BY email
);
