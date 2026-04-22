CREATE TABLE forum_replies (
    id          BIGSERIAL PRIMARY KEY,
    thread_id   BIGINT NOT NULL,
    author_id   BIGINT NOT NULL,
    content     TEXT NOT NULL,
    upvotes     INT NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_forum_replies_thread FOREIGN KEY (thread_id) REFERENCES forum_threads (id) ON DELETE CASCADE,
    CONSTRAINT fk_forum_replies_author FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_forum_replies_thread ON forum_replies (thread_id, created_at);
