package com.npham.spinnode.modules.resume.dto;

import java.util.List;

import com.npham.spinnode.modules.job.dto.response.JobResponse;

public record ResumeParseResponse(
        ParsedProfile profile,
        List<JobResponse> suggestedJobs
) {
    public record ParsedProfile(
            String name,
            String bio,
            String location,
            List<SkillItem> skills,
            List<ExperienceItem> experiences,
            List<ProjectItem> projects
    ) {}

    public record SkillItem(String name, String level) {}

    public record ExperienceItem(String title, String company, String duration, String description) {}

    public record ProjectItem(String name, String description, List<String> technologies, String link) {}
}
