-- ============================================================
-- Chat seed data for real-time messaging tests
--
-- Test accounts (password: "password")
--   alice@test.com  →  Alice Nguyen   (JOB_SEEKER)
--   bob@test.com    →  Bob Carter     (RECRUITER)
-- ============================================================

DO $$
DECLARE
  alice_id   BIGINT;
  bob_id     BIGINT;
  sarah_id   BIGINT;
  michael_id BIGINT;
  conv_id    BIGINT;
BEGIN

  -- ── Create test users ──────────────────────────────────────
  INSERT INTO users (email, password_hash, display_name, role, created_at)
  VALUES ('alice@test.com', '$2y$10$bUWJjmNq73C.rJV4cIiik.L2dnfvVYktLd.dD5fTOE3A4i9ve4022', 'Alice Nguyen', 'JOB_SEEKER', now() - INTERVAL '10 days')
  ON CONFLICT DO NOTHING;

  INSERT INTO users (email, password_hash, display_name, role, created_at)
  VALUES ('bob@test.com', '$2y$10$bUWJjmNq73C.rJV4cIiik.L2dnfvVYktLd.dD5fTOE3A4i9ve4022', 'Bob Carter', 'RECRUITER', now() - INTERVAL '10 days')
  ON CONFLICT DO NOTHING;

  SELECT id INTO alice_id   FROM users WHERE email = 'alice@test.com';
  SELECT id INTO bob_id     FROM users WHERE email = 'bob@test.com';
  SELECT id INTO sarah_id   FROM users WHERE email = 'sarah.chen@example.com';
  SELECT id INTO michael_id FROM users WHERE email = 'michael.park@example.com';

  -- ── Conversation 1: Alice ↔ Bob ────────────────────────────
  INSERT INTO conversations (created_at, updated_at)
  VALUES (now() - INTERVAL '3 days', now() - INTERVAL '10 minutes')
  RETURNING id INTO conv_id;

  INSERT INTO conversation_participants (conversation_id, user_id, last_read_at) VALUES
    (conv_id, bob_id,   now() - INTERVAL '5 minutes'),
    (conv_id, alice_id, now() - INTERVAL '2 hours');   -- Alice has unread

  INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES
    (conv_id, bob_id,   'Hi Alice! I came across your profile and your background in distributed systems is exactly what our team is looking for. Would you be open to learning more about a Senior Backend role?', now() - INTERVAL '3 days'),
    (conv_id, alice_id, 'Hey Bob! Thanks for reaching out — I''ve been following your company for a while. What tech stack does the team use?', now() - INTERVAL '3 days' + INTERVAL '2 hours'),
    (conv_id, bob_id,   'Great question! We use Java / Spring Boot with Kafka for event streaming and PostgreSQL. The team is about 8 engineers and we move fast.', now() - INTERVAL '2 days' + INTERVAL '9 hours'),
    (conv_id, alice_id, 'That sounds like a solid stack. What''s the rough salary range?', now() - INTERVAL '2 days' + INTERVAL '11 hours'),
    (conv_id, bob_id,   'We''re targeting $160k–$210k base plus equity and a 15% performance bonus. Also $5k home office budget.', now() - INTERVAL '2 days' + INTERVAL '12 hours'),
    (conv_id, alice_id, 'That range works for me. I''d be happy to move forward. What does the interview process look like?', now() - INTERVAL '1 day' + INTERVAL '9 hours'),
    (conv_id, bob_id,   '4 rounds total: recruiter screen, two technical rounds (coding + system design), and a values interview. Usually takes 2 weeks.', now() - INTERVAL '1 day' + INTERVAL '10 hours'),
    (conv_id, alice_id, 'That sounds very reasonable. Can we schedule the recruiter screen for next week?', now() - INTERVAL '1 day' + INTERVAL '11 hours'),
    -- Unread for Alice (sent after her last_read_at of now() - 2 hours)
    (conv_id, bob_id,   'Absolutely! I have Tuesday at 2pm or Thursday at 10am. Which works better for you?', now() - INTERVAL '1 hour'),
    (conv_id, bob_id,   'Also sent a calendar invite for both slots so you can pick whichever suits you!', now() - INTERVAL '10 minutes');

  -- ── Conversation 2: Alice ↔ Sarah (only if Sarah exists) ──
  IF sarah_id IS NOT NULL THEN
    INSERT INTO conversations (created_at, updated_at)
    VALUES (now() - INTERVAL '7 days', now() - INTERVAL '1 day')
    RETURNING id INTO conv_id;

    INSERT INTO conversation_participants (conversation_id, user_id, last_read_at) VALUES
      (conv_id, alice_id, now() - INTERVAL '1 day'),
      (conv_id, sarah_id, now() - INTERVAL '1 day');

    INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES
      (conv_id, sarah_id, 'Hey Alice! Did you end up applying to that Netflix role? I saw it on the jobs feed.', now() - INTERVAL '7 days' + INTERVAL '10 hours'),
      (conv_id, alice_id, 'Not yet — still polishing my resume. Did you hear back from the Stripe interview?', now() - INTERVAL '6 days'),
      (conv_id, sarah_id, 'Yes! Passed the first technical round. System design next week — honestly terrified lol', now() - INTERVAL '5 days' + INTERVAL '14 hours'),
      (conv_id, alice_id, 'You''ve got this! Stripe system design is usually about payments infra. Brush up on idempotency and distributed transactions.', now() - INTERVAL '5 days' + INTERVAL '15 hours'),
      (conv_id, sarah_id, 'That''s super helpful, thank you!! Want to do a mock system design session this weekend?', now() - INTERVAL '1 day' + INTERVAL '9 hours'),
      (conv_id, alice_id, 'For sure, Saturday morning works for me. I''ll send a Zoom link!', now() - INTERVAL '1 day' + INTERVAL '10 hours');
  END IF;

  -- ── Conversation 3: Bob ↔ Michael (only if Michael exists)
  IF michael_id IS NOT NULL THEN
    INSERT INTO conversations (created_at, updated_at)
    VALUES (now() - INTERVAL '5 days', now() - INTERVAL '4 days')
    RETURNING id INTO conv_id;

    INSERT INTO conversation_participants (conversation_id, user_id, last_read_at) VALUES
      (conv_id, bob_id,     now() - INTERVAL '4 days'),
      (conv_id, michael_id, now() - INTERVAL '4 days');

    INSERT INTO messages (conversation_id, sender_id, content, created_at) VALUES
      (conv_id, bob_id,     'Hi Michael, your full-stack experience looks like a great match for a role we''re hiring for. Are you open to new opportunities?', now() - INTERVAL '5 days' + INTERVAL '9 hours'),
      (conv_id, michael_id, 'Hi Bob! I''m passively looking. What''s the role and company?', now() - INTERVAL '4 days' + INTERVAL '8 hours'),
      (conv_id, bob_id,     'Senior Full-Stack role at a Series B fintech — React + Go, $170k–$200k + equity. Want me to send the full JD?', now() - INTERVAL '4 days' + INTERVAL '9 hours'),
      (conv_id, michael_id, 'Yes please send it over, I''ll take a look!', now() - INTERVAL '4 days' + INTERVAL '10 hours');
  END IF;

  -- ── Sync updated_at to latest message ─────────────────────
  UPDATE conversations c
  SET updated_at = (SELECT MAX(m.created_at) FROM messages m WHERE m.conversation_id = c.id)
  WHERE EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id);

END $$;
