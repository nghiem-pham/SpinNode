package com.npham.spinnode.modules.forum.dto.response;

import java.time.Instant;
import java.util.List;

public record ForumThreadResponse(
        Long id,
        String title,
        AuthorSummary author,
        String category,
        String content,
        int replies,
        int views,
        int upvotes,
        boolean pinned,
        boolean locked,
        Instant createdAt,
        Instant lastActivity,
        List<String> tags
) {
    public record AuthorSummary(Long id, String name, String avatar) {}
}
