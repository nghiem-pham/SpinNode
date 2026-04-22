package com.npham.spinnode.modules.recruiter.dto;

import java.time.Instant;

public record RecruiterJobPostingResponse(
        Long id,
        Long recruiterUserId,
        String title,
        String companyName,
        String location,
        String jobType,
        String salary,
        String description,
        String requirements,
        String applyUrl,
        Instant postedAt
) {}
