package com.npham.spinnode.modules.resume.service;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.List;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.npham.spinnode.modules.job.service.JobService;
import com.npham.spinnode.modules.resume.dto.ResumeParseResponse;
import com.npham.spinnode.modules.resume.dto.ResumeParseResponse.ExperienceItem;
import com.npham.spinnode.modules.resume.dto.ResumeParseResponse.ParsedProfile;
import com.npham.spinnode.modules.resume.dto.ResumeParseResponse.ProjectItem;
import com.npham.spinnode.modules.resume.dto.ResumeParseResponse.SkillItem;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ResumeService {

    private static final String GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String GROQ_MODEL = "llama-3.3-70b-versatile";
    private static final int SUGGESTED_JOBS_LIMIT = 5;

    @Value("${groq.api-key:}")
    private String groqApiKey;

    private final JobService jobService;
    private final ObjectMapper objectMapper;

    public ResumeParseResponse parse(MultipartFile file) {
        String resumeText = extractText(file);
        if (resumeText.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Could not extract text from resume");
        }

        ParsedProfile profile = callGroq(resumeText);
        List<String> skillNames = profile.skills().stream().map(SkillItem::name).toList();
        var suggestedJobs = jobService.getTopSuggestedJobs(skillNames, SUGGESTED_JOBS_LIMIT);

        return new ResumeParseResponse(profile, suggestedJobs);
    }

    private String extractText(MultipartFile file) {
        String filename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();
        try {
            if (filename.endsWith(".pdf")) {
                try (PDDocument doc = Loader.loadPDF(file.getBytes())) {
                    return new PDFTextStripper().getText(doc);
                }
            }
            // Plain text fallback (.txt, .md, etc.)
            return new String(file.getBytes());
        } catch (IOException e) {
            throw new ResponseStatusException(HttpStatus.UNPROCESSABLE_ENTITY, "Failed to read file: " + e.getMessage());
        }
    }

    private ParsedProfile callGroq(String resumeText) {
        if (groqApiKey == null || groqApiKey.isBlank()) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "Groq API key not configured");
        }

        String prompt = buildPrompt(resumeText);
        String requestBody;
        try {
            requestBody = objectMapper.writeValueAsString(new GroqRequest(
                    GROQ_MODEL,
                    List.of(new GroqMessage("user", prompt)),
                    0.1,
                    2000,
                    new GroqResponseFormat("json_object")
            ));
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to build Groq request");
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

        return parseGroqResponse(response.body());
    }

    private ParsedProfile parseGroqResponse(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            String content = root.path("choices").get(0).path("message").path("content").asText();
            JsonNode parsed = objectMapper.readTree(content);

            String name = parsed.path("name").asText("");
            String bio = parsed.path("bio").asText("");
            String location = parsed.path("location").asText("");

            List<SkillItem> skills = new ArrayList<>();
            for (JsonNode s : parsed.path("skills")) {
                String level = s.path("level").asText("Intermediate");
                if (!List.of("Beginner", "Intermediate", "Advanced", "Expert").contains(level)) {
                    level = "Intermediate";
                }
                skills.add(new SkillItem(s.path("name").asText(""), level));
            }

            List<ExperienceItem> experiences = new ArrayList<>();
            for (JsonNode e : parsed.path("experiences")) {
                experiences.add(new ExperienceItem(
                        e.path("title").asText(""),
                        e.path("company").asText(""),
                        e.path("duration").asText(""),
                        e.path("description").asText("")
                ));
            }

            List<ProjectItem> projects = new ArrayList<>();
            for (JsonNode p : parsed.path("projects")) {
                List<String> technologies = new ArrayList<>();
                for (JsonNode t : p.path("technologies")) technologies.add(t.asText());
                projects.add(new ProjectItem(
                        p.path("name").asText(""),
                        p.path("description").asText(""),
                        technologies,
                        p.path("link").asText(null)
                ));
            }

            return new ParsedProfile(name, bio, location, skills, experiences, projects);
        } catch (Exception e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "Failed to parse Groq response");
        }
    }

    private String buildPrompt(String resumeText) {
        return """
                You are a resume parser. Extract structured information from the resume below and return ONLY valid JSON with this exact structure:
                {
                  "name": "full name or empty string",
                  "bio": "2-3 sentence professional summary",
                  "location": "city, state/country or empty string",
                  "skills": [{"name": "skill name", "level": "Beginner|Intermediate|Advanced|Expert"}],
                  "experiences": [{"title": "job title", "company": "company name", "duration": "e.g. Jan 2021 - Mar 2023", "description": "1-2 sentence description"}],
                  "projects": [{"name": "project name", "description": "brief description", "technologies": ["tech1", "tech2"], "link": "url or empty string"}]
                }
                Return only the JSON object, no markdown, no explanation.

                Resume:
                """ + resumeText;
    }

    // ── Groq request records ──────────────────────────────────────────────────

    private record GroqRequest(
            String model,
            List<GroqMessage> messages,
            double temperature,
            int max_tokens,
            GroqResponseFormat response_format
    ) {}

    private record GroqMessage(String role, String content) {}

    private record GroqResponseFormat(String type) {}
}
