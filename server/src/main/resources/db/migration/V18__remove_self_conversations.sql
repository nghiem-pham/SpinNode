-- Delete conversations where all participants are the same user (self-conversations).
DELETE FROM conversations
WHERE id IN (
  SELECT conversation_id
  FROM conversation_participants
  GROUP BY conversation_id
  HAVING COUNT(DISTINCT user_id) < 2
);
