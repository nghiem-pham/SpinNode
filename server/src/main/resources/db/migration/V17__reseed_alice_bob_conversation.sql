-- Re-seed Alice↔Bob conversation (may have been cascade-deleted when
-- duplicate alice/bob users were removed in V16).

DO $$
DECLARE
  alice_id BIGINT;
  bob_id   BIGINT;
  conv_id  BIGINT;
  cnt      INT;
BEGIN
  SELECT id INTO alice_id FROM users WHERE email = 'alice@test.com';
  SELECT id INTO bob_id   FROM users WHERE email = 'bob@test.com';

  IF alice_id IS NULL OR bob_id IS NULL THEN
    RETURN;
  END IF;

  -- Only insert if no conversation between them exists
  SELECT COUNT(*) INTO cnt
  FROM conversation_participants cp1
  JOIN conversation_participants cp2
    ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = alice_id AND cp2.user_id = bob_id;

  IF cnt > 0 THEN
    RETURN;
  END IF;

  INSERT INTO conversations (created_at, updated_at)
  VALUES (now() - INTERVAL '3 days', now() - INTERVAL '10 minutes')
  RETURNING id INTO conv_id;

  INSERT INTO conversation_participants (conversation_id, user_id, last_read_at) VALUES
    (conv_id, bob_id,   now() - INTERVAL '5 minutes'),
    (conv_id, alice_id, now() - INTERVAL '2 hours');

  INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES
    (conv_id, bob_id,   'Hi Alice! I came across your profile and your background in distributed systems is exactly what our team is looking for. Would you be open to learning more about a Senior Backend role?', now() - INTERVAL '3 days'),
    (conv_id, alice_id, 'Hey Bob! Thanks for reaching out — I''ve been following your company for a while. What tech stack does the team use?', now() - INTERVAL '3 days' + INTERVAL '2 hours'),
    (conv_id, bob_id,   'Great question! We use Java / Spring Boot with Kafka for event streaming and PostgreSQL. The team is about 8 engineers and we move fast.', now() - INTERVAL '2 days' + INTERVAL '9 hours'),
    (conv_id, alice_id, 'That sounds like a solid stack. What''s the rough salary range?', now() - INTERVAL '2 days' + INTERVAL '11 hours'),
    (conv_id, bob_id,   'We''re targeting $160k–$210k base plus equity and a 15% performance bonus. Also $5k home office budget.', now() - INTERVAL '2 days' + INTERVAL '12 hours'),
    (conv_id, alice_id, 'That range works for me. I''d be happy to move forward. What does the interview process look like?', now() - INTERVAL '1 day' + INTERVAL '9 hours'),
    (conv_id, bob_id,   '4 rounds total: recruiter screen, two technical rounds (coding + system design), and a values interview. Usually takes 2 weeks.', now() - INTERVAL '1 day' + INTERVAL '10 hours'),
    (conv_id, alice_id, 'That sounds very reasonable. Can we schedule the recruiter screen for next week?', now() - INTERVAL '1 day' + INTERVAL '11 hours'),
    (conv_id, bob_id,   'Absolutely! I have Tuesday at 2pm or Thursday at 10am. Which works better for you?', now() - INTERVAL '1 hour'),
    (conv_id, bob_id,   'Also sent a calendar invite for both slots so you can pick whichever suits you!', now() - INTERVAL '10 minutes');

  UPDATE conversations
  SET updated_at = (SELECT MAX(created_at) FROM messages WHERE conversation_id = conv_id)
  WHERE id = conv_id;

END $$;
