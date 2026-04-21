package com.npham.spinnode.modules.follow.dto.response;

public record FollowResponse(
        Long userId,
        boolean following,
        long followersCount,
        long followingCount
) {}
