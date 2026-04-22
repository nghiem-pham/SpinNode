CREATE TABLE IF NOT EXISTS companies (
    id           BIGSERIAL PRIMARY KEY,
    name         VARCHAR(120) NOT NULL UNIQUE,
    industry     VARCHAR(120) NOT NULL,
    logo_url     VARCHAR(500),
    description  VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS jobs (
    id               BIGSERIAL PRIMARY KEY,
    company_id       BIGINT NOT NULL,
    title            VARCHAR(150) NOT NULL,
    location         VARCHAR(120) NOT NULL,
    job_type         VARCHAR(60) NOT NULL,
    salary           VARCHAR(80) NOT NULL,
    description      TEXT NOT NULL,
    requirements     TEXT NOT NULL,
    posted_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    featured_order   INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_jobs_company FOREIGN KEY (company_id) REFERENCES companies (id) ON DELETE CASCADE
);

CREATE INDEX idx_jobs_posted_at ON jobs (posted_at DESC);
CREATE INDEX idx_jobs_company_id ON jobs (company_id);

CREATE TABLE IF NOT EXISTS saved_jobs (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL,
    job_id      BIGINT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_saved_jobs_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_saved_jobs_job FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE,
    CONSTRAINT uk_saved_jobs_user_job UNIQUE (user_id, job_id)
);

CREATE TABLE IF NOT EXISTS user_profiles (
    user_id      BIGINT PRIMARY KEY,
    bio          TEXT NOT NULL DEFAULT '',
    location     VARCHAR(120) NOT NULL DEFAULT '',
    avatar_url   VARCHAR(500),
    cover_url    VARCHAR(500),

    CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS experiences (
    id             BIGSERIAL PRIMARY KEY,
    profile_user_id BIGINT NOT NULL,
    title          VARCHAR(120) NOT NULL,
    company        VARCHAR(120) NOT NULL,
    duration       VARCHAR(80) NOT NULL,
    description    TEXT NOT NULL,
    display_order  INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_experiences_profile FOREIGN KEY (profile_user_id) REFERENCES user_profiles (user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS projects (
    id             BIGSERIAL PRIMARY KEY,
    profile_user_id BIGINT NOT NULL,
    name           VARCHAR(120) NOT NULL,
    description    TEXT NOT NULL,
    technologies   VARCHAR(500) NOT NULL DEFAULT '',
    link           VARCHAR(500),
    display_order  INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_projects_profile FOREIGN KEY (profile_user_id) REFERENCES user_profiles (user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS skills (
    id             BIGSERIAL PRIMARY KEY,
    profile_user_id BIGINT NOT NULL,
    name           VARCHAR(80) NOT NULL,
    level          VARCHAR(32) NOT NULL,
    display_order  INT NOT NULL DEFAULT 0,

    CONSTRAINT fk_skills_profile FOREIGN KEY (profile_user_id) REFERENCES user_profiles (user_id) ON DELETE CASCADE
);
