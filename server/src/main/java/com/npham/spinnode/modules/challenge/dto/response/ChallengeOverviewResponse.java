package com.npham.spinnode.modules.challenge.dto.response;

import java.util.List;

public record ChallengeOverviewResponse(
        int currentStreak,
        long completedCount,
        int totalPoints,
        ChallengeResponse dailyChallenge,
        List<ChallengeResponse> pastChallenges
) {}
