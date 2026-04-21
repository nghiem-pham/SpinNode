package com.npham.spinnode.modules.job.dto.response;

import java.time.Instant;
import java.util.List;

public record JobResponse(
        Long id,
        CompanySummary company,
        String title,
        String location,
        String type,
        String salary,
        Instant postedAt,
        String description,
        List<String> requirements,
        boolean saved,
        String applyUrl
) {
    public record CompanySummary(
            Long id,
            String name,
            String logo,
            String industry,
            String description
    ) {}
}
