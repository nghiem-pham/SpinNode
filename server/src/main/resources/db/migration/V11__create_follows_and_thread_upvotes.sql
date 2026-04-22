CREATE TABLE IF NOT EXISTS thread_upvotes (
    id          BIGSERIAL PRIMARY KEY,
    thread_id   BIGINT NOT NULL,
    user_id     BIGINT NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_thread_upvotes_thread FOREIGN KEY (thread_id) REFERENCES forum_threads (id) ON DELETE CASCADE,
    CONSTRAINT fk_thread_upvotes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_thread_upvotes_thread_user UNIQUE (thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_thread_upvotes_thread_id ON thread_upvotes (thread_id);
CREATE INDEX IF NOT EXISTS idx_thread_upvotes_user_id ON thread_upvotes (user_id);

CREATE TABLE IF NOT EXISTS user_follows (
    id            BIGSERIAL PRIMARY KEY,
    follower_id   BIGINT NOT NULL,
    following_id  BIGINT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_user_follows_follower FOREIGN KEY (follower_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_user_follows_following FOREIGN KEY (following_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_user_follows_follower_following UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower_id ON user_follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following_id ON user_follows (following_id);
