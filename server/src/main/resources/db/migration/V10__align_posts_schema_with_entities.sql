ALTER TABLE posts
    ALTER COLUMN content TYPE TEXT;

ALTER TABLE posts
    ADD COLUMN IF NOT EXISTS image_url VARCHAR(500);

CREATE TABLE IF NOT EXISTS post_comments (
    id          BIGSERIAL PRIMARY KEY,
    post_id     BIGINT    NOT NULL,
    user_id     BIGINT    NOT NULL,
    content     TEXT      NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_post_comments_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_post_comments_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON post_comments (post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_user_id ON post_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created_at ON post_comments (created_at DESC);

CREATE TABLE IF NOT EXISTS post_likes (
    id          BIGSERIAL PRIMARY KEY,
    post_id     BIGINT    NOT NULL,
    user_id     BIGINT    NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_post_likes_post FOREIGN KEY (post_id) REFERENCES posts (id) ON DELETE CASCADE,
    CONSTRAINT fk_post_likes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT uk_post_likes_post_user UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON post_likes (user_id);
