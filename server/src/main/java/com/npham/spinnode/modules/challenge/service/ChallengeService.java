package com.npham.spinnode.modules.challenge.service;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.npham.spinnode.modules.challenge.dto.response.ChallengeOverviewResponse;
import com.npham.spinnode.modules.challenge.dto.response.ChallengeResponse;
import com.npham.spinnode.modules.challenge.entity.Challenge;
import com.npham.spinnode.modules.challenge.entity.ChallengeCompletion;
import com.npham.spinnode.modules.challenge.repository.ChallengeCompletionRepository;
import com.npham.spinnode.modules.challenge.repository.ChallengeRepository;
import com.npham.spinnode.modules.challenge.scheduler.DailyChallengeScheduler;
import com.npham.spinnode.modules.user.entity.User;
import com.npham.spinnode.modules.user.service.UserService;

import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class ChallengeService {

    private final ChallengeRepository challengeRepository;
    private final ChallengeCompletionRepository completionRepository;
    private final UserService userService;
    private final DailyChallengeScheduler dailyChallengeScheduler;

    @Transactional
    public ChallengeOverviewResponse getOverview(String email) {
        User user = userService.getRequiredByEmail(email);
        List<ChallengeCompletion> completions = completionRepository.findByUser_IdOrderByCompletedAtDesc(user.getId());
        Map<Long, ChallengeCompletion> completionMap = new HashMap<>();
        completions.forEach(c -> completionMap.putIfAbsent(c.getChallenge().getId(), c));

        // Auto-fetch from LeetCode if today's challenge is missing
        Challenge daily = challengeRepository.findFirstByDailyDateOrderByIdAsc(LocalDate.now())
                .orElseGet(dailyChallengeScheduler::syncTodayIfAbsent);

        if (daily == null) {
            throw new ResponseStatusException(NOT_FOUND, "No daily challenge available today");
        }

        List<ChallengeResponse> pastChallenges = challengeRepository.findByDailyDateIsNullOrderByIdAsc().stream()
                .map(c -> toResponse(c, completionMap.get(c.getId())))
                .toList();

        long completedCount = completions.size();
        int currentStreak = calculateStreak(completions);
        int totalPoints = completions.stream()
                .map(ChallengeCompletion::getChallenge)
                .mapToInt(this::pointsForDifficulty)
                .sum();

        return new ChallengeOverviewResponse(
                currentStreak,
                completedCount,
                totalPoints,
                toResponse(daily, completionMap.get(daily.getId())),
                pastChallenges
        );
    }

    @Transactional
    public ChallengeResponse completeDailyChallenge(String email) {
        User user = userService.getRequiredByEmail(email);
        Challenge daily = challengeRepository.findFirstByDailyDateOrderByIdAsc(LocalDate.now())
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Daily challenge not found"));

        ChallengeCompletion completion = completionRepository.findByUser_IdAndChallenge_Id(user.getId(), daily.getId())
                .orElseGet(() -> completionRepository.save(ChallengeCompletion.builder()
                        .user(user)
                        .challenge(daily)
                        .completedAt(Instant.now())
                        .build()));

        return toResponse(daily, completion);
    }

    private ChallengeResponse toResponse(Challenge challenge, ChallengeCompletion completion) {
        String topicsStr = challenge.getTopics();
        List<String> topics = (topicsStr != null && !topicsStr.isBlank())
                ? Arrays.stream(topicsStr.split(","))
                        .map(String::trim)
                        .filter(s -> !s.isBlank())
                        .toList()
                : List.of();

        return new ChallengeResponse(
                challenge.getId(),
                challenge.getTitle(),
                challenge.getDifficulty(),
                challenge.getDescription(),
                topics,
                challenge.getAcceptanceRate(),
                challenge.getSubmissionsCount(),
                challenge.getLeetcodeUrl(),
                completion != null,
                completion == null ? null : completion.getCompletedAt(),
                challenge.getDailyDate()
        );
    }

    private int pointsForDifficulty(Challenge challenge) {
        return switch (challenge.getDifficulty()) {
            case "Easy" -> 50;
            case "Medium" -> 100;
            case "Hard" -> 150;
            default -> 0;
        };
    }

    private int calculateStreak(List<ChallengeCompletion> completions) {
        List<LocalDate> dates = completions.stream()
                .map(c -> c.getCompletedAt().atZone(ZoneOffset.UTC).toLocalDate())
                .distinct()
                .sorted(Comparator.reverseOrder())
                .toList();

        int streak = 0;
        LocalDate cursor = LocalDate.now();
        for (LocalDate date : dates) {
            if (date.equals(cursor)) {
                streak++;
                cursor = cursor.minusDays(1);
            } else if (date.equals(cursor.minusDays(1)) && streak == 0) {
                cursor = date;
                streak++;
                cursor = cursor.minusDays(1);
            } else if (!date.equals(cursor)) {
                break;
            }
        }
        return streak;
    }
}
