package com.npham.spinnode.modules.messaging.dto.response;

import java.time.Instant;
import java.util.List;

public record ConversationResponse(
        Long id,
        Long participantId,
        String name,
        String avatar,
        String lastMessage,
        Instant timestamp,
        long unread,
        boolean online,
        List<MessageResponse> messages
) {}
