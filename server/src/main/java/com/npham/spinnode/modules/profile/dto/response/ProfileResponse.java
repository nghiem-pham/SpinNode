package com.npham.spinnode.modules.profile.dto.response;

import java.time.Instant;
import java.util.List;

public record ProfileResponse(
        Long userId,
        String name,
        String email,
        String bio,
        String location,
        String avatarUrl,
        String coverUrl,
        Instant createdAt,
        List<ExperienceItem> experiences,
        List<ProjectItem> projects,
        List<SkillItem> skills,
        boolean profileVisible
) {
    public record ExperienceItem(Long id, String title, String company, String duration, String description) {}
    public record ProjectItem(Long id, String name, String description, List<String> technologies, String link) {}
    public record SkillItem(Long id, String name, String level) {}
}
