package com.npham.spinnode.modules.forum.dto.response;

import java.time.Instant;

public record ForumReplyResponse(
        Long id,
        AuthorSummary author,
        String content,
        int upvotes,
        Instant createdAt,
        Long threadId
) {
    public record AuthorSummary(Long id, String name, String avatar) {}
}
