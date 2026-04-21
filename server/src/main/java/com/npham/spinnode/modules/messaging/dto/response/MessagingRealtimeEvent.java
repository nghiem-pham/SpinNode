package com.npham.spinnode.modules.messaging.dto.response;

public record MessagingRealtimeEvent(
        String type,
        ConversationResponse conversation
) {}
