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
import com.npham.spinnode.modules.ai.dto.CoverLetterRequest;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AiService {

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String GROQ_MODEL = "llama-3.3-70b-versatile";

    @Value("${groq.api-key:}")
    private String groqApiKey;

    private final ObjectMapper objectMapper;

    public AiTextResponse generateCoverLetter(CoverLetterRequest req) {
        String skills = req.skills() != null ? String.join(", ", req.skills()) : "";
        String jobDesc = req.jobDescription() != null && !req.jobDescription().isBlank()
                ? "\nJob Description: " + req.jobDescription()
                : "";
        String name = req.applicantName() != null && !req.applicantName().isBlank()
                ? req.applicantName()
                : "the applicant";

        String prompt = """
                You are an expert career coach and professional writer.
                Write a compelling, personalized cover letter for a job application.

                Applicant Name: %s
                Job Title: %s
                Company: %s%s
                Applicant's Skills: %s

                Write a professional 3-4 paragraph cover letter:
                1. Opening — hook with genuine enthusiasm and why this company
                2. Body — highlight 2-3 relevant skills with brief examples
                3. Closing — express desire to discuss further, thank them

                Use the applicant's actual name. Do not use any placeholder text.
                """.formatted(name, req.jobTitle(), req.company(), jobDesc, skills);

        return new AiTextResponse(callGroq(prompt));
    }

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
