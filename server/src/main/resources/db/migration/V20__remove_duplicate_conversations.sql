-- Remove duplicate 1-to-1 conversations between the same pair of users,
-- keeping only the oldest one (lowest id) for each pair.
DELETE FROM conversations
WHERE id IN (
  SELECT conv_id
  FROM (
    SELECT
      cp1.conversation_id AS conv_id,
      LEAST(cp1.user_id, cp2.user_id)    AS user_a,
      GREATEST(cp1.user_id, cp2.user_id) AS user_b,
      ROW_NUMBER() OVER (
        PARTITION BY LEAST(cp1.user_id, cp2.user_id), GREATEST(cp1.user_id, cp2.user_id)
        ORDER BY cp1.conversation_id ASC
      ) AS rn
    FROM conversation_participants cp1
    JOIN conversation_participants cp2
      ON cp1.conversation_id = cp2.conversation_id
     AND cp1.user_id < cp2.user_id
    WHERE (
      SELECT COUNT(*) FROM conversation_participants cp3
      WHERE cp3.conversation_id = cp1.conversation_id
    ) = 2
  ) ranked
  WHERE rn > 1
);
