package com.npham.spinnode.modules.messaging.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateConversationRequest(
        @NotNull Long participantUserId,
        @NotBlank String message
) {}
