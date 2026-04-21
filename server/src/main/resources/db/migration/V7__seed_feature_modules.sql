INSERT INTO users (email, password_hash, display_name, created_at)
VALUES
    ('sarah.chen@example.com', 'demo', 'Sarah Chen', now() - INTERVAL '30 days'),
    ('michael.park@example.com', 'demo', 'Michael Park', now() - INTERVAL '28 days'),
    ('alex.thompson@example.com', 'demo', 'Alex Thompson', now() - INTERVAL '24 days'),
    ('emma.wilson@example.com', 'demo', 'Emma Wilson', now() - INTERVAL '20 days'),
    ('jennifer.lee@example.com', 'demo', 'Jennifer Lee', now() - INTERVAL '18 days'),
    ('ryan.mitchell@example.com', 'demo', 'Ryan Mitchell', now() - INTERVAL '15 days')
ON CONFLICT (email) DO NOTHING;

INSERT INTO companies (name, industry, logo_url, description)
VALUES
    ('Google', 'Technology', 'https://logo.clearbit.com/google.com', '15 open positions'),
    ('Meta', 'Social Media', 'https://logo.clearbit.com/meta.com', '8 open positions'),
    ('Amazon', 'E-commerce & Cloud', 'https://logo.clearbit.com/amazon.com', '12 open positions'),
    ('Apple', 'Technology', 'https://logo.clearbit.com/apple.com', '6 open positions'),
    ('Netflix', 'Entertainment & Streaming', 'https://logo.clearbit.com/netflix.com', '4 open positions'),
    ('OpenAI', 'Artificial Intelligence', 'https://logo.clearbit.com/openai.com', '5 open positions')
ON CONFLICT (name) DO NOTHING;

INSERT INTO jobs (company_id, title, location, job_type, salary, description, requirements, posted_at, featured_order)
SELECT c.id, j.title, j.location, j.job_type, j.salary, j.description, j.requirements, now() - j.posted_offset, j.featured_order
FROM (
    VALUES
        ('Google', 'Senior Frontend Engineer', 'Mountain View, CA', 'Full-time', '$150,000 - $200,000',
         'Build scalable web applications using React and TypeScript.', 'React,TypeScript,System Design,Performance', INTERVAL '2 hours', 1),
        ('Meta', 'Full Stack Developer', 'Menlo Park, CA', 'Full-time', '$140,000 - $190,000',
         'Work on cutting-edge social media features.', 'React,Java,Distributed Systems,Product Sense', INTERVAL '5 hours', 2),
        ('Amazon', 'Backend Engineer', 'Seattle, WA', 'Full-time', '$130,000 - $180,000',
         'Design and implement scalable microservices.', 'Java,Spring Boot,PostgreSQL,AWS', INTERVAL '1 day', 3),
        ('Apple', 'iOS Developer', 'Cupertino, CA', 'Full-time', '$145,000 - $195,000',
         'Create amazing user experiences for iOS devices.', 'Swift,UIKit,Performance,Testing', INTERVAL '2 days', 4),
        ('Netflix', 'DevOps Engineer', 'Los Gatos, CA', 'Full-time', '$135,000 - $185,000',
         'Build and maintain cloud infrastructure.', 'Kubernetes,AWS,Observability,CI/CD', INTERVAL '3 days', 5),
        ('OpenAI', 'Machine Learning Engineer', 'San Francisco, CA', 'Full-time', '$160,000 - $220,000',
         'Develop AI models and infrastructure.', 'Python,PyTorch,Distributed Training,ML Systems', INTERVAL '4 days', 6)
) AS j(company_name, title, location, job_type, salary, description, requirements, posted_offset, featured_order)
JOIN companies c ON c.name = j.company_name
WHERE NOT EXISTS (
    SELECT 1 FROM jobs existing WHERE existing.title = j.title AND existing.location = j.location
);

INSERT INTO challenges (title, difficulty, description, topics, acceptance_rate, submissions_count, leetcode_url, daily_date)
VALUES
    ('Two Sum', 'Easy', 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', 'Array,Hash Table', '49.2%', '12.5M', 'https://leetcode.com/problems/two-sum/', CURRENT_DATE),
    ('Add Two Numbers', 'Medium', 'Add two numbers represented by linked lists.', 'Linked List,Math,Recursion', '40.1%', '6.2M', 'https://leetcode.com/problems/add-two-numbers/', NULL),
    ('Longest Substring Without Repeating Characters', 'Medium', 'Find the length of the longest substring without repeating characters.', 'String,Hash Table,Sliding Window', '33.8%', '7.8M', 'https://leetcode.com/problems/longest-substring-without-repeating-characters/', NULL),
    ('Median of Two Sorted Arrays', 'Hard', 'Return the median of two sorted arrays.', 'Array,Binary Search,Divide and Conquer', '37.0%', '3.1M', 'https://leetcode.com/problems/median-of-two-sorted-arrays/', NULL),
    ('Reverse Integer', 'Medium', 'Reverse digits of a signed 32-bit integer.', 'Math', '27.5%', '4.5M', 'https://leetcode.com/problems/reverse-integer/', NULL),
    ('Container With Most Water', 'Medium', 'Find two lines that form a container holding the most water.', 'Array,Two Pointers,Greedy', '54.2%', '3.9M', 'https://leetcode.com/problems/container-with-most-water/', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO forum_categories (slug, name, description, icon, topics_count, posts_count, color)
VALUES
    ('career-advice', 'Career Advice', 'Get guidance on career growth and professional development', 'Target', 1248, 8934, 'bg-blue-500'),
    ('interview-prep', 'Interview Preparation', 'Share interview experiences and preparation tips', 'Users', 892, 6721, 'bg-purple-500'),
    ('salary-negotiation', 'Salary & Compensation', 'Discuss salaries, benefits, and negotiation strategies', 'DollarSign', 456, 3289, 'bg-green-500'),
    ('company-culture', 'Company Culture', 'Share insights about company work environments', 'Briefcase', 678, 4521, 'bg-orange-500'),
    ('tech-stack', 'Tech Stack & Tools', 'Discuss technologies, frameworks, and development tools', 'Code', 1534, 12456, 'bg-indigo-500'),
    ('learning', 'Learning Resources', 'Share courses, books, and learning materials', 'BookOpen', 743, 5632, 'bg-pink-500')
ON CONFLICT (slug) DO NOTHING;

INSERT INTO user_profiles (user_id, bio, location, avatar_url, cover_url)
SELECT u.id,
       'Passionate about building products and helping others grow in tech.',
       'San Francisco, CA',
       CONCAT('https://api.dicebear.com/7.x/avataaars/svg?seed=', u.email),
       NULL
FROM users u
WHERE u.email IN (
    'sarah.chen@example.com',
    'michael.park@example.com',
    'alex.thompson@example.com',
    'emma.wilson@example.com',
    'jennifer.lee@example.com',
    'ryan.mitchell@example.com'
)
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO forum_threads (category_id, author_id, title, content, replies, views, upvotes, is_pinned, is_locked, created_at, last_activity_at, tags)
SELECT c.id, u.id, t.title, t.content, t.replies, t.views, t.upvotes, t.is_pinned, FALSE,
       now() - t.created_offset, now() - t.activity_offset, t.tags
FROM (
    VALUES
        ('salary-negotiation', 'sarah.chen@example.com', 'How to negotiate salary as a mid-level engineer?', 'I have an offer from a big tech company and want to negotiate. What are the best practices?', 24, 1842, 156, TRUE, INTERVAL '2 hours', INTERVAL '15 minutes', 'negotiation,salary,mid-level'),
        ('career-advice', 'michael.park@example.com', 'Google L4 vs Meta E5 - Which should I choose?', 'I have offers from both companies. Looking for advice on which to choose based on career growth.', 47, 3256, 234, TRUE, INTERVAL '5 hours', INTERVAL '23 minutes', 'google,meta,career-choice'),
        ('interview-prep', 'alex.thompson@example.com', 'System Design Interview Tips - Complete Guide', 'After interviewing at 10+ companies, here are my best tips for system design rounds.', 89, 8934, 892, FALSE, INTERVAL '1 day', INTERVAL '2 hours', 'system-design,interview,guide'),
        ('company-culture', 'jennifer.lee@example.com', 'Is Amazon''s work culture really that bad?', 'I keep hearing mixed reviews about Amazon. Current and former employees, what''s your take?', 134, 12456, 456, FALSE, INTERVAL '2 days', INTERVAL '1 hour', 'amazon,culture,work-life-balance'),
        ('tech-stack', 'ryan.mitchell@example.com', 'React vs Vue in 2026 - What should I learn?', 'Transitioning from backend to frontend. Which framework has better job prospects?', 67, 4523, 234, FALSE, INTERVAL '3 days', INTERVAL '4 hours', 'react,vue,frontend'),
        ('learning', 'emma.wilson@example.com', 'Best LeetCode learning path for beginners', 'Just started preparing for interviews. What''s the best order to tackle LeetCode problems?', 52, 6789, 378, FALSE, INTERVAL '4 days', INTERVAL '6 hours', 'leetcode,beginner,learning-path')
) AS t(category_slug, author_email, title, content, replies, views, upvotes, is_pinned, created_offset, activity_offset, tags)
JOIN forum_categories c ON c.slug = t.category_slug
JOIN users u ON u.email = t.author_email
WHERE NOT EXISTS (
    SELECT 1 FROM forum_threads existing WHERE existing.title = t.title
);

INSERT INTO conversations (created_at, updated_at)
SELECT now() - INTERVAL '7 days', now() - INTERVAL '2 minutes'
WHERE NOT EXISTS (SELECT 1 FROM conversations);

INSERT INTO conversation_participants (conversation_id, user_id, last_read_at)
SELECT c.id, u.id, CASE WHEN u.email = 'sarah.chen@example.com' THEN now() - INTERVAL '1 hour' ELSE now() - INTERVAL '10 minutes' END
FROM conversations c
JOIN users u ON u.email IN ('sarah.chen@example.com', 'michael.park@example.com')
WHERE c.id = 1
ON CONFLICT DO NOTHING;

INSERT INTO messages (conversation_id, sender_id, content, created_at)
SELECT 1, u.id, m.content, now() - m.sent_offset
FROM (
    VALUES
        ('sarah.chen@example.com', 'Thanks for the interview tips!', INTERVAL '12 minutes'),
        ('michael.park@example.com', 'Glad they helped. How did the round go?', INTERVAL '10 minutes'),
        ('sarah.chen@example.com', 'Much better this time. I felt way more prepared.', INTERVAL '2 minutes')
) AS m(sender_email, content, sent_offset)
JOIN users u ON u.email = m.sender_email
WHERE EXISTS (SELECT 1 FROM conversations WHERE id = 1)
  AND NOT EXISTS (SELECT 1 FROM messages existing WHERE existing.conversation_id = 1);

INSERT INTO notifications (user_id, actor_id, type, content, post_content, created_at, read_at)
SELECT target.id, actor.id, n.type, n.content, n.post_content, now() - n.created_offset, n.read_at
FROM (
    VALUES
        ('sarah.chen@example.com', 'michael.park@example.com', 'like', NULL, 'Just had an amazing day exploring the city!', INTERVAL '5 minutes', NULL),
        ('sarah.chen@example.com', 'emma.wilson@example.com', 'comment', 'This looks incredible! Where is this place?', 'Just had an amazing day exploring the city!', INTERVAL '15 minutes', NULL),
        ('sarah.chen@example.com', 'alex.thompson@example.com', 'follow', NULL, NULL, INTERVAL '1 hour', now() - INTERVAL '30 minutes'),
        ('sarah.chen@example.com', 'jennifer.lee@example.com', 'share', NULL, 'Working on some exciting new projects!', INTERVAL '3 hours', now() - INTERVAL '2 hours')
) AS n(target_email, actor_email, type, content, post_content, created_offset, read_at)
JOIN users target ON target.email = n.target_email
JOIN users actor ON actor.email = n.actor_email
WHERE NOT EXISTS (SELECT 1 FROM notifications existing WHERE existing.user_id = target.id);
