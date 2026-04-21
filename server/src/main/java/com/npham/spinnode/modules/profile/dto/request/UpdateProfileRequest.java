package com.npham.spinnode.modules.profile.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank @Size(max = 50) String name,
        @NotNull String bio,
        @NotNull String location,
        String avatarUrl,
        String coverUrl,
        @Valid List<ExperienceItem> experiences,
        @Valid List<ProjectItem> projects,
        @Valid List<SkillItem> skills
) {
    public record ExperienceItem(
            Long id,
            @NotBlank String title,
            @NotBlank String company,
            @NotBlank String duration,
            @NotBlank String description
    ) {}

    public record ProjectItem(
            Long id,
            @NotBlank String name,
            @NotBlank String description,
            @NotNull List<String> technologies,
            String link
    ) {}

    public record SkillItem(
            Long id,
            @NotBlank String name,
            @NotBlank String level
    ) {}
}
