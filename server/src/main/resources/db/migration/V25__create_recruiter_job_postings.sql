CREATE TABLE recruiter_job_postings (
  id BIGSERIAL PRIMARY KEY,
  recruiter_user_id BIGINT NOT NULL REFERENCES users(id),
  title VARCHAR(150) NOT NULL,
  company_name VARCHAR(100) NOT NULL,
  location VARCHAR(120) NOT NULL,
  job_type VARCHAR(60) NOT NULL DEFAULT 'Full-time',
  salary VARCHAR(80),
  description TEXT NOT NULL,
  requirements TEXT NOT NULL,
  apply_url VARCHAR(500),
  posted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
