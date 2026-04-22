-- =============================================================================
-- V19: Seed 200 users, recruiter-posted jobs, and community forum threads
-- Idempotent: uses WHERE NOT EXISTS / ON CONFLICT DO NOTHING throughout.
-- Password for all seed users: "password"
-- =============================================================================

DO $$
DECLARE
  -- ── Name pools ──────────────────────────────────────────────────────────────
  first_names TEXT[] := ARRAY[
    'Alex','Jordan','Taylor','Morgan','Casey','Riley','Avery','Quinn','Skyler','Drew',
    'Blake','Cameron','Dakota','Emery','Finley','Harper','Hayden','Jamie','Jesse','Kennedy',
    'Lake','London','Marley','Mason','Micah','Parker','Peyton','Phoenix','Reese','River',
    'Rowan','Sage','Sawyer','Scout','Shiloh','Sloane','Spencer','Sydney','Tatum','Teagan',
    'Tristan','Tyler','Winter','Wren','Zion','Aria','Beau','Cruz','Eden','Eli'
  ];
  last_names TEXT[] := ARRAY[
    'Anderson','Brown','Carter','Davis','Evans','Foster','Garcia','Harris','Jackson','Johnson',
    'Jones','Kim','Lee','Lewis','Martin','Martinez','Miller','Moore','Nguyen','Patel',
    'Robinson','Rodriguez','Smith','Taylor','Thomas','Thompson','Turner','Walker','White','Williams',
    'Wilson','Wright','Young','Zhang','Chen','Wang','Liu','Park','Singh','Kumar',
    'Shah','Gupta','Ali','Ahmed','Hassan','Lopez','Gonzalez','Ramirez','Torres','Flores'
  ];

  -- ── Job title pools ──────────────────────────────────────────────────────────
  job_titles TEXT[] := ARRAY[
    'Senior Software Engineer','Frontend Developer','Backend Engineer','Full Stack Developer',
    'Staff Engineer','Principal Engineer','iOS Developer','Android Developer',
    'DevOps Engineer','Site Reliability Engineer','Platform Engineer','Cloud Architect',
    'Data Engineer','Data Scientist','Machine Learning Engineer','AI Research Scientist',
    'Product Manager','Technical Program Manager','Engineering Manager','Security Engineer',
    'QA Engineer','Mobile Engineer','Embedded Systems Engineer','Blockchain Developer',
    'Game Developer','Graphics Engineer','Infrastructure Engineer','Database Administrator',
    'Solutions Architect','Developer Advocate'
  ];

  -- ── Location pool ─────────────────────────────────────────────────────────
  locations TEXT[] := ARRAY[
    'San Francisco, CA','New York, NY','Seattle, WA','Austin, TX','Boston, MA',
    'Chicago, IL','Los Angeles, CA','Denver, CO','Atlanta, GA','Miami, FL',
    'Portland, OR','San Diego, CA','Remote','Hybrid – NYC','Hybrid – SF',
    'London, UK','Toronto, Canada','Berlin, Germany','Amsterdam, Netherlands','Singapore'
  ];

  -- ── Salary ranges ────────────────────────────────────────────────────────
  salaries TEXT[] := ARRAY[
    '$90k–$120k','$110k–$140k','$130k–$160k','$150k–$180k','$160k–$200k',
    '$180k–$220k','$200k–$250k','$220k–$280k','$120k–$160k + equity','$140k–$180k + equity'
  ];

  -- ── Job types ────────────────────────────────────────────────────────────
  job_types TEXT[] := ARRAY[
    'FULL_TIME','FULL_TIME','FULL_TIME','FULL_TIME','FULL_TIME',
    'PART_TIME','CONTRACT','REMOTE','HYBRID','INTERNSHIP'
  ];

  -- ── Forum categories ─────────────────────────────────────────────────────
  category_slugs TEXT[] := ARRAY[
    'career-advice','interview-prep','salary-negotiation',
    'company-culture','tech-stack','learning-resources'
  ];

  -- ── Thread title pools per category ─────────────────────────────────────
  career_titles TEXT[] := ARRAY[
    'How do I break into big tech from a startup?',
    'Is it worth getting a CS master''s degree in 2026?',
    'How to stand out as a new grad in a tough market?',
    'What skills matter most for engineering managers?',
    'Switching from backend to ML — where do I start?',
    'Remote vs in-office: sharing my experience after 2 years',
    'How I went from bootcamp to $150k in 18 months',
    'The honest truth about working at a FAANG company',
    'Career pivot at 35 — is it too late?',
    'What does a Staff Engineer actually do?'
  ];
  interview_titles TEXT[] := ARRAY[
    'Cracking the Google system design interview in 2026',
    'How I prepared for FAANG coding interviews in 3 months',
    'Behavioral interview tips that actually work',
    'Best resources for LeetCode prep — my ranked list',
    'Failed 4 interviews then got my dream job — my story',
    'System design: how to design a URL shortener',
    'What interviewers actually look for (insider perspective)',
    'Mock interview tips — what I learned doing 30 of them',
    'How to explain a gap in your resume confidently',
    'Rejected by Amazon, hired by Meta — what changed'
  ];
  salary_titles TEXT[] := ARRAY[
    'Got a $210k offer — here''s how I negotiated it',
    'Should I disclose my current salary during negotiations?',
    'Salary bands at top tech companies — 2026 breakdown',
    'Negotiating equity: RSUs vs options explained',
    'How to evaluate a total compensation package',
    'Is $180k reasonable for a senior engineer in NYC?',
    'My company gave me a 5% raise — should I leave?',
    'Competing offers: how to use them without burning bridges',
    'Base vs bonus vs equity — what matters most long-term?',
    'I asked for a raise and got promoted instead'
  ];
  culture_titles TEXT[] := ARRAY[
    'Why I left my 6-figure job at a top tech firm',
    'What nobody tells you about startup culture',
    'How to spot toxic workplace red flags in interviews',
    'The best engineering cultures I''ve experienced',
    'Work-life balance: which companies actually deliver?',
    'My honest review of working at a Series B startup',
    'Why I chose a smaller company over Google',
    'The interview process told me everything about the culture',
    'How to evaluate company culture before you join',
    'Open offices vs remote — what actually works for engineers'
  ];
  tech_titles TEXT[] := ARRAY[
    'Why we migrated from REST to GraphQL — lessons learned',
    'Spring Boot vs Node.js for microservices in 2026',
    'Our journey from monolith to Kubernetes',
    'PostgreSQL vs MongoDB: real production experience',
    'How we reduced API latency by 80% with caching',
    'My favorite tools for building side projects fast',
    'The best tech stack for a solo SaaS founder',
    'Why we chose Kafka over RabbitMQ',
    'React vs Vue in 2026 — an honest comparison',
    'CI/CD pipeline setup that saved our team 10 hours/week'
  ];
  learning_titles TEXT[] := ARRAY[
    'The best free resources to learn system design',
    'How I got AWS certified in 6 weeks while working full-time',
    'Top books every software engineer should read',
    'My 90-day plan to learn backend development from scratch',
    'Best YouTube channels for staying current in tech',
    'How to build a portfolio that gets you hired',
    'Learning Rust in 2026 — worth it or not?',
    'The Feynman technique applied to coding concepts',
    'Building in public: what I learned shipping 5 projects',
    'From self-taught to senior engineer — my learning path'
  ];

  -- ── Post content pool ────────────────────────────────────────────────────
  post_contents TEXT[] := ARRAY[
    'Just shipped a feature I''ve been building for 3 weeks. The feeling of seeing it live is unmatched. 🚀',
    'Hot take: clean code matters more than clever code. Readability is a feature.',
    'Finally cracked a bug that had me stumped for two days. Sometimes you just need to step away and come back fresh.',
    'The best career advice I received: always be learning, but also always be shipping.',
    'Reminder that "senior" is about impact and ownership, not just years of experience.',
    'Just finished my first system design interview. Way harder than LeetCode. Time to study more.',
    'Nothing beats pair programming when you''re stuck on a hard problem. Fresh eyes are invaluable.',
    'Unpopular opinion: the daily standup is the most underrated part of agile if done right.',
    'Three years at the same company taught me more than job-hopping ever could.',
    'The code review is not about the code — it''s about the team understanding the system together.',
    'Started learning Rust this month. The borrow checker is humbling but I see why people love it.',
    'Got my first open source PR merged today. Small contribution, big milestone. 🎉',
    'Interview tip: always think out loud. Silence kills your chances more than wrong answers.',
    'If you''re not documenting your architecture decisions, future you will regret it.',
    'Networking advice: be genuinely helpful online. Opportunities find people who give value first.',
    'Just hit 1 year at my current role. Learned more here than I expected. Grateful for good mentors.',
    'The best developers I know ask a lot of questions. Curiosity > arrogance every time.',
    'TypeScript has made our codebase so much more maintainable. The initial setup cost pays off fast.',
    'Side project update: finally added auth. Took longer than building the actual feature. Classic.',
    'Team retro today surfaced issues we hadn''t talked about in months. Every team should do these.',
    'Learning to say no to feature requests is one of the hardest skills in product development.',
    'Five years into my career and I still google basic syntax. And that''s completely fine.',
    'Just passed my AWS Solutions Architect exam. Six weeks of study, totally worth it.',
    'A good mentor is worth more than any course or certification. Seek them out intentionally.',
    'My productivity doubled when I started time-blocking my calendar. Highly recommend.',
    'Finished reading Clean Architecture. More of a mindset shift than a technical guide.',
    'Took a week off from coding and came back with so many new ideas. Rest is productive.',
    'The soft skills no one teaches in CS: giving feedback, handling conflict, and managing up.',
    'Deployed to production on a Friday — lived to tell the tale. Just barely. 😅',
    'Building side projects is the fastest way to learn things that matter in the real world.',
    'Finally set up proper monitoring and alerting. Can''t believe I ran without it for so long.',
    'New job starts next Monday. Nervous and excited. Can''t wait to meet the team.',
    'Gave my first internal tech talk today. Terrifying but worth it. Sharing knowledge is leadership.',
    'Spent the morning reviewing PRs. Good code review culture makes the whole team better.',
    'Breaking a monolith into services is harder than building microservices from scratch. Respect to those who do it.',
    'Applied for a job on Monday, final interview on Friday, offer by the following Tuesday. That was fast.',
    'The real 10x engineer is the one who makes the rest of the team 2x better.',
    'Obsessed with how much faster my builds got after enabling incremental compilation.',
    'Reminder: you don''t need to be an expert to share what you''ve learned. Write that blog post.',
    'Had a 1:1 with my manager that completely changed how I think about career growth. Good managers are rare.'
  ];

  -- ── Company data for recruiter jobs ─────────────────────────────────────
  company_names TEXT[] := ARRAY[
    'TechVision Inc','CloudScale Systems','DataPulse Analytics','NexGen Software','Apex Engineering',
    'Fusion Labs','Quantum Code','ByteForge','HorizonAI','Synapse Technologies',
    'Nimbus Cloud','CoreLogic Solutions','PixelCraft Studios','Aether Systems','Prism Analytics',
    'VertexAI','Orbital Labs','CipherTech','Mosaic Software','Catalyst Systems'
  ];
  company_industries TEXT[] := ARRAY[
    'Software','Cloud Computing','Analytics','Enterprise Software','Fintech',
    'Developer Tools','Quantum Computing','Infrastructure','Artificial Intelligence','Machine Learning',
    'Cloud Services','Business Intelligence','Gaming & Media','Cybersecurity','Data & Analytics',
    'AI/ML','Research & Development','Security','Enterprise SaaS','Growth Technology'
  ];
  company_descs TEXT[] := ARRAY[
    'Building the future of developer tooling with AI-powered code intelligence.',
    'Cloud infrastructure that scales from zero to millions with zero downtime.',
    'Turning raw data into actionable insights for Fortune 500 companies.',
    'Next-generation enterprise software built for the modern workforce.',
    'Engineering solutions at the intersection of finance and technology.',
    'Developer-first tools that remove friction from the software delivery lifecycle.',
    'Quantum-classical hybrid systems for the next wave of computing.',
    'Infrastructure automation that lets engineering teams ship with confidence.',
    'AI assistants that augment human decision-making across industries.',
    'Neural network platforms powering real-time personalization at scale.',
    'Serverless cloud built for developers who demand performance and simplicity.',
    'Business intelligence that connects your data, teams, and decisions.',
    'Interactive media and gaming experiences powered by cutting-edge graphics.',
    'Zero-trust security for distributed systems and cloud-native applications.',
    'Analytics infrastructure that handles petabyte-scale data with ease.',
    'Vertical AI products that transform entire industry workflows.',
    'Deep research on human-computer interaction and intelligent systems.',
    'Encryption and threat intelligence protecting global enterprises.',
    'All-in-one enterprise platform replacing 12 point solutions with one.',
    'Growth automation and experimentation tools for product-led companies.'
  ];

  job_descriptions TEXT[] := ARRAY[
    'Join our core platform team to architect scalable backend services handling millions of requests daily. You will work closely with product, design, and infrastructure to ship features that directly impact our users.',
    'We are looking for a talented engineer to help us build the next generation of our product. You will own features end-to-end, contribute to technical design decisions, and collaborate with a world-class team.',
    'As a member of our infrastructure team, you will design and implement systems that underpin our entire product suite. Reliability, performance, and developer experience are your north stars.',
    'Join a fast-moving team shipping high-quality product features to millions of users. We value pragmatism, ownership, and a deep curiosity about the problems our customers face.',
    'You will work on deeply technical challenges at scale — distributed systems, real-time data processing, and low-latency APIs. Strong fundamentals and a growth mindset are a must.'
  ];

  job_requirements TEXT[] := ARRAY[
    '5+ years of software engineering experience. Proficiency in at least one backend language (Java, Go, Python). Experience with cloud platforms (AWS, GCP, or Azure). Strong communication skills.',
    '3+ years of full-stack experience. Proficiency in React and at least one backend framework. Experience with SQL and NoSQL databases. Ability to work independently in a fast-paced environment.',
    '4+ years of systems or infrastructure experience. Deep knowledge of Kubernetes, Terraform, and CI/CD pipelines. Experience designing for high availability and fault tolerance.',
    '2+ years of professional software development. Strong grasp of data structures, algorithms, and system design fundamentals. Experience shipping production features.',
    '6+ years of engineering experience. Track record of leading technical projects. Ability to mentor junior engineers and drive architectural decisions across teams.'
  ];

  -- ── Thread content ───────────────────────────────────────────────────────
  thread_body TEXT := 'I wanted to share my experience and get some thoughts from the community. This has been something I''ve been thinking about for a while and I believe others might find value in discussing it openly. Would love to hear your perspectives and any advice based on what you''ve been through.';

  -- Working variables
  u_id BIGINT;
  company_id BIGINT;
  cat_id BIGINT;
  fname TEXT; lname TEXT; v_display_name TEXT; v_email TEXT;
  n INT;
  cat_slug TEXT;
  thread_title TEXT;
  tag_str TEXT;
BEGIN

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 1. Insert 200 users + user_profiles
  -- ═══════════════════════════════════════════════════════════════════════════
  FOR n IN 1..200 LOOP
    fname := first_names[((n - 1) % array_length(first_names, 1)) + 1];
    lname := last_names[((n - 1) % array_length(last_names, 1)) + 1];
    v_display_name := fname || ' ' || lname;
    v_email := 'seed.user' || n || '@spinnode.dev';

    INSERT INTO users (email, password_hash, display_name, role, created_at)
    SELECT
      v_email,
      '$2y$10$bUWJjmNq73C.rJV4cIiik.L2dnfvVYktLd.dD5fTOE3A4i9ve4022',
      v_display_name,
      CASE WHEN n <= 100 THEN 'JOB_SEEKER' ELSE 'RECRUITER' END,
      now() - ((200 - n + 1) * INTERVAL '1 day')
    WHERE NOT EXISTS (SELECT 1 FROM users WHERE users.email = v_email);

    -- Ensure user_profile exists
    SELECT id INTO u_id FROM users WHERE users.email = v_email;

    INSERT INTO user_profiles (user_id, bio, location, avatar_url, cover_url)
    SELECT
      u_id,
      CASE WHEN n <= 100
        THEN 'Software professional passionate about building great products and growing as an engineer.'
        ELSE 'Talent acquisition specialist connecting top engineers with companies changing the world.'
      END,
      locations[((n - 1) % array_length(locations, 1)) + 1],
      'https://ui-avatars.com/api/?name=' || replace(v_display_name, ' ', '+') || '&background=0e8f8f&color=fff&bold=true&rounded=true&size=128',
      NULL
    WHERE NOT EXISTS (SELECT 1 FROM user_profiles WHERE user_profiles.user_id = u_id);
  END LOOP;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 2. Companies + recruiter jobs (n = 101..200 → recruiters)
  -- ═══════════════════════════════════════════════════════════════════════════
  FOR n IN 1..20 LOOP
    INSERT INTO companies (name, industry, logo_url, description)
    SELECT
      company_names[n],
      company_industries[n],
      'https://ui-avatars.com/api/?name=' || replace(company_names[n], ' ', '+') || '&background=1a1a2e&color=fff&bold=true&size=128',
      company_descs[n]
    WHERE NOT EXISTS (SELECT 1 FROM companies WHERE companies.name = company_names[n]);
  END LOOP;

  -- Each recruiter (users 101-200) posts one job
  FOR n IN 101..200 LOOP
    v_email := 'seed.user' || n || '@spinnode.dev';
    SELECT id INTO u_id FROM users WHERE users.email = v_email;
    IF u_id IS NULL THEN CONTINUE; END IF;

    -- Already posted a job? Skip.
    IF EXISTS (
      SELECT 1 FROM jobs j
      JOIN companies c ON c.id = j.company_id
      WHERE c.name = company_names[((n - 101) % 20) + 1]
        AND j.title = job_titles[((n - 101) % array_length(job_titles, 1)) + 1]
    ) THEN CONTINUE; END IF;

    SELECT id INTO company_id FROM companies
    WHERE name = company_names[((n - 101) % 20) + 1];

    IF company_id IS NULL THEN CONTINUE; END IF;

    INSERT INTO jobs (company_id, title, location, job_type, salary, description, requirements, posted_at, featured_order)
    VALUES (
      company_id,
      job_titles[((n - 101) % array_length(job_titles, 1)) + 1],
      locations[((n - 1) % array_length(locations, 1)) + 1],
      job_types[((n - 101) % array_length(job_types, 1)) + 1],
      salaries[((n - 101) % array_length(salaries, 1)) + 1],
      job_descriptions[((n - 101) % array_length(job_descriptions, 1)) + 1],
      job_requirements[((n - 101) % array_length(job_requirements, 1)) + 1],
      now() - ((200 - n + 1) * INTERVAL '12 hours'),
      0
    );
  END LOOP;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 3. Forum threads (1 per user across all 6 categories)
  -- ═══════════════════════════════════════════════════════════════════════════
  FOR n IN 1..200 LOOP
    v_email := 'seed.user' || n || '@spinnode.dev';
    SELECT id INTO u_id FROM users WHERE users.email = v_email;
    IF u_id IS NULL THEN CONTINUE; END IF;

    BEGIN
      cat_slug := category_slugs[((n - 1) % 6) + 1];

      thread_title := CASE cat_slug
        WHEN 'career-advice'      THEN career_titles[((n - 1) % array_length(career_titles, 1)) + 1]
        WHEN 'interview-prep'     THEN interview_titles[((n - 1) % array_length(interview_titles, 1)) + 1]
        WHEN 'salary-negotiation' THEN salary_titles[((n - 1) % array_length(salary_titles, 1)) + 1]
        WHEN 'company-culture'    THEN culture_titles[((n - 1) % array_length(culture_titles, 1)) + 1]
        WHEN 'tech-stack'         THEN tech_titles[((n - 1) % array_length(tech_titles, 1)) + 1]
        WHEN 'learning-resources' THEN learning_titles[((n - 1) % array_length(learning_titles, 1)) + 1]
        ELSE 'Discussion #' || n
      END;

      tag_str := CASE cat_slug
        WHEN 'career-advice'      THEN 'career,growth,advice'
        WHEN 'interview-prep'     THEN 'interview,prep,tips'
        WHEN 'salary-negotiation' THEN 'salary,negotiation,compensation'
        WHEN 'company-culture'    THEN 'culture,workplace,teams'
        WHEN 'tech-stack'         THEN 'tech,engineering,tools'
        WHEN 'learning-resources' THEN 'learning,resources,skills'
        ELSE 'general'
      END;

      SELECT id INTO cat_id FROM forum_categories WHERE slug = cat_slug;
      IF cat_id IS NULL THEN CONTINUE; END IF;

      INSERT INTO forum_threads (category_id, author_id, title, content, replies, views, upvotes, is_pinned, is_locked, created_at, last_activity_at, tags)
      SELECT
        cat_id, u_id, thread_title, thread_body,
        (n % 30), (n * 7 % 500), (n % 20),
        FALSE, FALSE,
        now() - ((200 - n + 1) * INTERVAL '6 hours'),
        now() - ((200 - n + 1) * INTERVAL '3 hours'),
        tag_str
      WHERE NOT EXISTS (
        SELECT 1 FROM forum_threads ft WHERE ft.author_id = u_id AND ft.title = thread_title
      );
    END;
  END LOOP;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 4. Posts (1 per user, 200 posts)
  -- ═══════════════════════════════════════════════════════════════════════════
  FOR n IN 1..200 LOOP
    v_email := 'seed.user' || n || '@spinnode.dev';
    SELECT id INTO u_id FROM users WHERE users.email = v_email;
    IF u_id IS NULL THEN CONTINUE; END IF;

    INSERT INTO posts (user_id, content, created_at)
    SELECT
      u_id,
      post_contents[((n - 1) % array_length(post_contents, 1)) + 1],
      now() - ((200 - n + 1) * INTERVAL '4 hours')
    WHERE NOT EXISTS (SELECT 1 FROM posts WHERE posts.user_id = u_id);
  END LOOP;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- 5. Update forum category counters to reflect new threads
  -- ═══════════════════════════════════════════════════════════════════════════
  UPDATE forum_categories fc
  SET
    topics_count = (SELECT COUNT(*) FROM forum_threads ft WHERE ft.category_id = fc.id),
    posts_count  = (SELECT COUNT(*) FROM forum_threads ft WHERE ft.category_id = fc.id) * 3;

END $$;
