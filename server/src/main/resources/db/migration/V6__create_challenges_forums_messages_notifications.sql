CREATE TABLE IF NOT EXISTS challenges (
    id                 BIGSERIAL PRIMARY KEY,
    title              VARCHAR(180) NOT NULL,
    difficulty         VARCHAR(20) NOT NULL,
    description        TEXT NOT NULL,
    topics             VARCHAR(255) NOT NULL DEFAULT '',
    acceptance_rate    VARCHAR(20) NOT NULL,
    submissions_count  VARCHAR(40) NOT NULL,
    leetcode_url       VARCHAR(500) NOT NULL,
    daily_date         DATE
);

CREATE TABLE IF NOT EXISTS challenge_completions (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    challenge_id  BIGINT NOT NULL,
    completed_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_challenge_completions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_challenge_completions_challenge FOREIGN KEY (challenge_id) REFERENCES challenges (id) ON DELETE CASCADE,
    CONSTRAINT uk_challenge_completion_user_challenge UNIQUE (user_id, challenge_id)
);

CREATE TABLE IF NOT EXISTS forum_categories (
    id            BIGSERIAL PRIMARY KEY,
    slug          VARCHAR(80) NOT NULL UNIQUE,
    name          VARCHAR(120) NOT NULL,
    description   VARCHAR(255) NOT NULL,
    icon          VARCHAR(32) NOT NULL,
    topics_count  INT NOT NULL DEFAULT 0,
    posts_count   INT NOT NULL DEFAULT 0,
    color         VARCHAR(32) NOT NULL
);

CREATE TABLE IF NOT EXISTS forum_threads (
    id               BIGSERIAL PRIMARY KEY,
    category_id      BIGINT NOT NULL,
    author_id        BIGINT NOT NULL,
    title            VARCHAR(200) NOT NULL,
    content          TEXT NOT NULL,
    replies          INT NOT NULL DEFAULT 0,
    views            INT NOT NULL DEFAULT 0,
    upvotes          INT NOT NULL DEFAULT 0,
    is_pinned        BOOLEAN NOT NULL DEFAULT FALSE,
    is_locked        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    tags             VARCHAR(255) NOT NULL DEFAULT '',

    CONSTRAINT fk_forum_threads_category FOREIGN KEY (category_id) REFERENCES forum_categories (id) ON DELETE CASCADE,
    CONSTRAINT fk_forum_threads_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_forum_threads_activity ON forum_threads (last_activity_at DESC);

CREATE TABLE IF NOT EXISTS conversations (
    id          BIGSERIAL PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
    id               BIGSERIAL PRIMARY KEY,
    conversation_id  BIGINT NOT NULL,
    user_id          BIGINT NOT NULL,
    last_read_at     TIMESTAMPTZ,

    CONSTRAINT fk_conversation_participants_conversation FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
    CONSTRAINT fk_conversation_participants_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_conversation_participants UNIQUE (conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
    id               BIGSERIAL PRIMARY KEY,
    conversation_id  BIGINT NOT NULL,
    sender_id        BIGINT NOT NULL,
    content          TEXT NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_messages_conversation FOREIGN KEY (conversation_id) REFERENCES conversations (id) ON DELETE CASCADE,
    CONSTRAINT fk_messages_sender FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_conversation_created_at ON messages (conversation_id, created_at DESC);

CREATE TABLE IF NOT EXISTS notifications (
    id            BIGSERIAL PRIMARY KEY,
    user_id       BIGINT NOT NULL,
    actor_id      BIGINT NOT NULL,
    type          VARCHAR(20) NOT NULL,
    content       VARCHAR(255),
    post_content  VARCHAR(255),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    read_at       TIMESTAMPTZ,

    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_notifications_actor FOREIGN KEY (actor_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_notifications_user_created_at ON notifications (user_id, created_at DESC);
