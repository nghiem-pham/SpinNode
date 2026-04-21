package com.npham.spinnode.modules.preference.service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.npham.spinnode.modules.preference.dto.request.SavePreferencesRequest;
import com.npham.spinnode.modules.preference.dto.response.PreferencesResponse;
import com.npham.spinnode.modules.preference.entity.JobPreference;
import com.npham.spinnode.modules.preference.repository.JobPreferenceRepository;
import com.npham.spinnode.modules.user.entity.User;
import com.npham.spinnode.modules.user.service.UserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class JobPreferenceService {

    private final JobPreferenceRepository jobPreferenceRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public PreferencesResponse getPreferences(String email) {
        User user = userService.getRequiredByEmail(email);
        return jobPreferenceRepository.findByUser_Id(user.getId())
                .map(this::toResponse)
                .orElse(emptyResponse());
    }

    @Transactional
    public PreferencesResponse savePreferences(String email, SavePreferencesRequest req) {
        User user = userService.getRequiredByEmail(email);

        JobPreference pref = jobPreferenceRepository.findByUser_Id(user.getId())
                .orElseGet(() -> JobPreference.builder().user(user).build());

        pref.setExperienceLevel(req.experienceLevel());
        pref.setJobTypes(joinCsv(req.jobTypes()));
        pref.setRemotePref(req.remotePref());
        pref.setPreferredLocations(joinCsv(req.preferredLocations()));
        pref.setPreferredSkills(joinCsv(req.preferredSkills()));
        pref.setSalaryMin(req.salaryMin());
        pref.setSalaryMax(req.salaryMax());
        pref.setOnboardingComplete(true);

        return toResponse(jobPreferenceRepository.save(pref));
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    public Optional<JobPreference> findForUser(Long userId) {
        return jobPreferenceRepository.findByUser_Id(userId);
    }

    private PreferencesResponse toResponse(JobPreference pref) {
        return new PreferencesResponse(
                pref.getExperienceLevel(),
                splitCsv(pref.getJobTypes()),
                pref.getRemotePref(),
                splitCsv(pref.getPreferredLocations()),
                splitCsv(pref.getPreferredSkills()),
                pref.getSalaryMin(),
                pref.getSalaryMax(),
                pref.isOnboardingComplete()
        );
    }

    private PreferencesResponse emptyResponse() {
        return new PreferencesResponse("", List.of(), "Any", List.of(), List.of(), null, null, false);
    }

    public static List<String> splitCsv(String csv) {
        if (csv == null || csv.isBlank()) return List.of();
        return Arrays.stream(csv.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    private static String joinCsv(List<String> list) {
        if (list == null || list.isEmpty()) return "";
        return String.join(",", list.stream().map(String::trim).filter(s -> !s.isEmpty()).toList());
    }
}
