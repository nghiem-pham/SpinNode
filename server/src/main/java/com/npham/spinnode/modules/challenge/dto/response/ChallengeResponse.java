package com.npham.spinnode.modules.challenge.dto.response;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ChallengeResponse(
        Long id,
        String title,
        String difficulty,
        String description,
        List<String> topics,
        String acceptance,
        String submissions,
        String leetcodeUrl,
        boolean completed,
        Instant completedAt,
        LocalDate dailyDate
) {}
