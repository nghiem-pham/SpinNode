package com.npham.spinnode.modules.messaging.dto.request;

import jakarta.validation.constraints.NotBlank;

public record SendMessageRequest(@NotBlank String message) {}
