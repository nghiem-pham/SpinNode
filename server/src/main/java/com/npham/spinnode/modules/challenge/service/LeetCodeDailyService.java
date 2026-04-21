package com.npham.spinnode.modules.challenge.service;

import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

/**
 * Fetches only the minimal public metadata for LeetCode's daily challenge:
 * title, difficulty, and link back to LeetCode. No problem content is stored.
 */
@Service
public class LeetCodeDailyService {

    private static final Logger log = LoggerFactory.getLogger(LeetCodeDailyService.class);

    private static final String GRAPHQL_URL = "https://leetcode.com/graphql";
    private static final String QUERY =
            "{ activeDailyCodingChallengeQuestion { date link question { title difficulty } } }";

    private final RestClient restClient;

    public LeetCodeDailyService() {
        this.restClient = RestClient.builder()
                .baseUrl(GRAPHQL_URL)
                .defaultHeader("Content-Type", "application/json")
                // LeetCode requires a Referer header
                .defaultHeader("Referer", "https://leetcode.com")
                .build();
    }

    /** Returns today's LeetCode daily challenge metadata, or empty if the fetch fails. */
    public Optional<DailyChallenge> fetchToday() {
        try {
            GraphQLResponse response = restClient.post()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(new GraphQLRequest(QUERY))
                    .retrieve()
                    .body(GraphQLResponse.class);

            if (response == null || response.data() == null
                    || response.data().activeDailyCodingChallengeQuestion() == null) {
                log.warn("LeetCode GraphQL returned empty response");
                return Optional.empty();
            }

            ActiveDailyChallenge adc = response.data().activeDailyCodingChallengeQuestion();
            String url = "https://leetcode.com" + adc.link();
            String difficulty = normaliseDifficulty(adc.question().difficulty());

            return Optional.of(new DailyChallenge(adc.question().title(), difficulty, url));
        } catch (Exception e) {
            log.error("Failed to fetch LeetCode daily challenge: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private String normaliseDifficulty(String raw) {
        if (raw == null) return "Medium";
        return switch (raw.toLowerCase()) {
            case "easy"   -> "Easy";
            case "hard"   -> "Hard";
            default       -> "Medium";
        };
    }

    // ── Result type ──────────────────────────────────────────────────────────

    public record DailyChallenge(String title, String difficulty, String url) {}

    // ── JSON mapping (GraphQL response shape) ────────────────────────────────

    private record GraphQLRequest(String query) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record GraphQLResponse(ResponseData data) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ResponseData(ActiveDailyChallenge activeDailyCodingChallengeQuestion) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ActiveDailyChallenge(String date, String link, QuestionMeta question) {}

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record QuestionMeta(String title, String difficulty) {}
}
