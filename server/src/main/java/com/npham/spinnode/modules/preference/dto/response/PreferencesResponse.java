package com.npham.spinnode.modules.preference.dto.response;

import java.util.List;

public record PreferencesResponse(
        String experienceLevel,
        List<String> jobTypes,
        String remotePref,
        List<String> preferredLocations,
        List<String> preferredSkills,
        Integer salaryMin,
        Integer salaryMax,
        boolean onboardingComplete
) {}
