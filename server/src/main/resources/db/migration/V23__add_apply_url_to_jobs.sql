-- Add apply_url column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS apply_url VARCHAR(500);

-- Set real career-page URLs for the seeded FAANG / real companies
UPDATE jobs SET apply_url = 'https://careers.google.com/'
WHERE company_id = (SELECT id FROM companies WHERE name = 'Google' LIMIT 1);

UPDATE jobs SET apply_url = 'https://www.metacareers.com/jobs/'
WHERE company_id = (SELECT id FROM companies WHERE name = 'Meta' LIMIT 1);

UPDATE jobs SET apply_url = 'https://www.amazon.jobs/en/'
WHERE company_id = (SELECT id FROM companies WHERE name = 'Amazon' LIMIT 1);

UPDATE jobs SET apply_url = 'https://jobs.apple.com/'
WHERE company_id = (SELECT id FROM companies WHERE name = 'Apple' LIMIT 1);

UPDATE jobs SET apply_url = 'https://jobs.netflix.com/'
WHERE company_id = (SELECT id FROM companies WHERE name = 'Netflix' LIMIT 1);

UPDATE jobs SET apply_url = 'https://openai.com/careers/'
WHERE company_id = (SELECT id FROM companies WHERE name = 'OpenAI' LIMIT 1);

-- All other (fictional) companies will have apply_url = NULL.
-- The application layer will fall back to a LinkedIn job search URL for those.
