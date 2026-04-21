package com.npham.spinnode.modules.recruiter.dto;

public record JobPostRequest(
        String title,
        String companyName,
        String location,
        String jobType,
        String salary,
        String description,
        String requirements,
        String applyUrl
) {}
