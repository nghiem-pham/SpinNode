package com.npham.spinnode.modules.challenge.scheduler;

import java.time.LocalDate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.npham.spinnode.modules.challenge.entity.Challenge;
import com.npham.spinnode.modules.challenge.repository.ChallengeRepository;
import com.npham.spinnode.modules.challenge.service.LeetCodeDailyService;

import lombok.RequiredArgsConstructor;

/**
 * Fetches the LeetCode daily challenge each day at 00:05 UTC and persists it
 * so the Challenges page always has a card to show.
 */
@Component
@RequiredArgsConstructor
public class DailyChallengeScheduler {

    private static final Logger log = LoggerFactory.getLogger(DailyChallengeScheduler.class);

    private final LeetCodeDailyService leetCodeDailyService;
    private final ChallengeRepository challengeRepository;

    /** Runs at 00:05 UTC every day. */
    @Scheduled(cron = "0 5 0 * * *")
    public void syncDailyChallenge() {
        syncTodayIfAbsent();
    }

    /**
     * Fetches and saves today's challenge if one isn't stored yet.
     * Returns the saved (or already-existing) challenge, or null on failure.
     */
    public Challenge syncTodayIfAbsent() {
        LocalDate today = LocalDate.now();
        return challengeRepository.findFirstByDailyDateOrderByIdAsc(today).orElseGet(() -> {
            log.info("No daily challenge for {}. Fetching from LeetCode…", today);
            return leetCodeDailyService.fetchToday()
                    .map(lc -> {
                        Challenge saved = challengeRepository.save(Challenge.builder()
                                .title(lc.title())
                                .difficulty(lc.difficulty())
                                .leetcodeUrl(lc.url())
                                .dailyDate(today)
                                .build());
                        log.info("Saved daily challenge: {} ({})", saved.getTitle(), saved.getDifficulty());
                        return saved;
                    })
                    .orElseGet(() -> {
                        // LeetCode fetch failed — reuse the most recently scheduled challenge
                        log.warn("LeetCode fetch failed for {}. Falling back to most recent challenge.", today);
                        return challengeRepository.findTopByDailyDateIsNotNullOrderByDailyDateDesc()
                                .map(existing -> {
                                    existing.setDailyDate(today);
                                    return challengeRepository.save(existing);
                                })
                                .orElse(null);
                    });
        });
    }
}
