package com.npham.spinnode.modules.user.dto.response;

public record UserSummaryResponse(
        Long id,
        String displayName,
        String role,
        String avatar,
        long followersCount,
        boolean following
) {}
