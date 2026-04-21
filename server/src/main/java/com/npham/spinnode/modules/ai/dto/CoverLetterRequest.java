package com.npham.spinnode.modules.ai.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;

public record CoverLetterRequest(
        @NotBlank String jobTitle,
        @NotBlank String company,
        String jobDescription,
        List<String> skills,
        String applicantName
) {}
