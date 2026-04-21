package com.npham.spinnode.modules.notification.dto.response;

import java.time.Instant;

public record NotificationResponse(
        Long id,
        String type,
        ActorSummary user,
        String content,
        String postContent,
        Instant timestamp,
        boolean read
) {
    public record ActorSummary(Long id, String name, String avatar) {}
}
