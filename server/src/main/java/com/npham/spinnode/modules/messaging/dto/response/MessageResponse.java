package com.npham.spinnode.modules.messaging.dto.response;

import java.time.Instant;

public record MessageResponse(
        Long id,
        Long senderId,
        String senderName,
        String senderAvatar,
        String text,
        Instant timestamp
) {}
