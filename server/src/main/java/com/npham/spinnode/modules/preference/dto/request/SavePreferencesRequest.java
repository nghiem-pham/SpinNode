package com.npham.spinnode.modules.preference.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record SavePreferencesRequest(
        @NotBlank String experienceLevel,
        @NotNull List<String> jobTypes,
        @NotBlank String remotePref,
        List<String> preferredLocations,
        List<String> preferredSkills,
        Integer salaryMin,
        Integer salaryMax
) {}
