CREATE TABLE job_preferences (
    user_id             BIGINT PRIMARY KEY,
    experience_level    VARCHAR(20)   NOT NULL DEFAULT '',
    job_types           VARCHAR(200)  NOT NULL DEFAULT '',   -- CSV: "Full-time,Contract"
    remote_pref         VARCHAR(20)   NOT NULL DEFAULT 'Any',
    preferred_locations VARCHAR(500)  NOT NULL DEFAULT '',   -- CSV: "San Francisco,Remote"
    preferred_skills    VARCHAR(1000) NOT NULL DEFAULT '',   -- CSV: "React,TypeScript,Node.js"
    salary_min          INT,
    salary_max          INT,
    onboarding_complete BOOLEAN       NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
    CONSTRAINT fk_job_preferences_user
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);
