package com.npham.spinnode.modules.ai.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.npham.spinnode.modules.ai.dto.AiTextResponse;
import com.npham.spinnode.modules.ai.dto.ChatRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AiService {

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String GROQ_MODEL = "llama-3.3-70b-versatile";

    @Value("${groq.api-key:}")
    private String groqApiKey;

    private final ObjectMapper objectMapper;

    public AiTextResponse chat(ChatRequest req) {
        String systemContext = """
                You are a helpful career assistant specializing in resumes, cover letters, and job applications.
                Keep responses concise and actionable. Format with bullet points when listing items.
                """;
        return new AiTextResponse(callGroq(systemContext + "\n\nUser: " + req.message()));
    }

    private String callGroq(String prompt) {
        if (groqApiKey == null || groqApiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Groq API key not configured");
        }

        String requestBody;
        try {
            requestBody = objectMapper.writeValueAsString(new GroqRequest(
                    GROQ_MODEL,
                    List.of(new GroqMessage("user", prompt)),
                    0.7,
                    1500
            ));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to build request");
        }

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(GROQ_URL))
                .header("Authorization", "Bearer " + groqApiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();

        HttpResponse<String> response;
        try {
            response = HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
        } catch (IOException | InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to reach Groq API");
        }

        if (response.statusCode() != 200) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Groq API error: " + response.statusCode());
        }

        try {
            JsonNode root = objectMapper.readTree(response.body());
            return root.path("choices").get(0).path("message").path("content").asText();
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to parse Groq response");
        }
    }

    private record GroqRequest(String model, List<GroqMessage> messages, double temperature, int max_tokens) {}
    private record GroqMessage(String role, String content) {}
}
