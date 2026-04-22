CREATE TABLE IF NOT EXISTS posts (
    id          BIGSERIAL    PRIMARY KEY,
    content     VARCHAR(280) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    user_id     BIGINT       NOT NULL,

    CONSTRAINT fk_posts_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_posts_user_id    ON posts (user_id);
CREATE INDEX idx_posts_created_at ON posts (created_at DESC);
