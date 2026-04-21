package com.npham.spinnode.modules.job.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.npham.spinnode.modules.job.dto.response.JobResponse;
import com.npham.spinnode.modules.job.entity.Job;
import com.npham.spinnode.modules.job.entity.SavedJob;
import com.npham.spinnode.modules.job.repository.JobRepository;
import com.npham.spinnode.modules.job.repository.SavedJobRepository;
import com.npham.spinnode.modules.preference.entity.JobPreference;
import com.npham.spinnode.modules.preference.service.JobPreferenceService;
import com.npham.spinnode.modules.user.entity.User;
import com.npham.spinnode.modules.user.service.UserService;

import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final SavedJobRepository savedJobRepository;
    private final UserService userService;
    private final JobPreferenceService jobPreferenceService;

    @Transactional(readOnly = true)
    public List<JobResponse> getJobs(String email) {
        User user = userService.getRequiredByEmail(email);
        Set<Long> savedJobIds = savedJobRepository.findByUser_Id(user.getId()).stream()
                .map(savedJob -> savedJob.getJob().getId())
                .collect(Collectors.toSet());

        final List<Job> allJobs = jobRepository.findAllByOrderByFeaturedOrderAscPostedAtDesc();

        // Rank jobs by user preferences when onboarding is complete
        List<Job> jobs = jobPreferenceService.findForUser(user.getId())
                .filter(JobPreference::isOnboardingComplete)
                .map(pref -> rankByPreferences(allJobs, pref))
                .orElse(allJobs);

        return jobs.stream()
                .map(job -> toResponse(job, savedJobIds.contains(job.getId())))
                .toList();
    }

    // ── Preference-based ranking ───────────────────────────────────────────────

    private List<Job> rankByPreferences(List<Job> jobs, JobPreference pref) {
        List<String> types     = JobPreferenceService.splitCsv(pref.getJobTypes());
        List<String> locations = JobPreferenceService.splitCsv(pref.getPreferredLocations());
        List<String> skills    = JobPreferenceService.splitCsv(pref.getPreferredSkills());
        boolean remoteOnly     = "Remote".equalsIgnoreCase(pref.getRemotePref());

        return jobs.stream()
                .sorted(Comparator.comparingInt(
                        (Job job) -> scoreJob(job, types, locations, skills, remoteOnly)
                ).reversed())
                .collect(Collectors.toList());
    }

    private int scoreJob(Job job, List<String> types, List<String> locations,
                         List<String> skills, boolean remoteOnly) {
        int score = 0;
        String corpus      = (job.getTitle() + " " + job.getDescription() + " " + job.getRequirements()).toLowerCase();
        String locationLow = job.getLocation().toLowerCase();
        String typeLow     = job.getJobType().toLowerCase();

        // Job type match (+10)
        for (String t : types) {
            if (typeLow.contains(t.toLowerCase())) { score += 10; break; }
        }

        // Remote preference (+8 boost when job is remote)
        if (remoteOnly && locationLow.contains("remote")) score += 8;

        // Location match (+6)
        for (String loc : locations) {
            if (!loc.isBlank() && locationLow.contains(loc.toLowerCase())) { score += 6; break; }
        }

        // Skill keyword matches (+3 per skill found in job corpus)
        for (String skill : skills) {
            if (!skill.isBlank() && corpus.contains(skill.toLowerCase())) score += 3;
        }

        return score;
    }

    @Transactional(readOnly = true)
    public List<JobResponse> getTopSuggestedJobs(List<String> skills, int limit) {
        List<Job> allJobs = jobRepository.findAllByOrderByFeaturedOrderAscPostedAtDesc();
        return allJobs.stream()
                .filter(job -> scoreJobBySkills(job, skills) > 0)
                .sorted(Comparator.comparingInt((Job job) -> scoreJobBySkills(job, skills)).reversed())
                .limit(limit)
                .map(job -> toResponse(job, false))
                .toList();
    }

    private int scoreJobBySkills(Job job, List<String> skills) {
        String corpus = (job.getTitle() + " " + job.getDescription() + " " + job.getRequirements()).toLowerCase();
        int score = 0;
        for (String skill : skills) {
            if (!skill.isBlank() && corpus.contains(skill.toLowerCase())) score += 3;
        }
        return score;
    }

    @Transactional
    public JobResponse toggleSavedJob(String email, Long jobId) {
        User user = userService.getRequiredByEmail(email);
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND, "Job not found"));

        savedJobRepository.findByUser_IdAndJob_Id(user.getId(), jobId)
                .ifPresentOrElse(savedJobRepository::delete, () -> savedJobRepository.save(SavedJob.builder()
                        .user(user)
                        .job(job)
                        .createdAt(Instant.now())
                        .build()));

        boolean saved = savedJobRepository.findByUser_IdAndJob_Id(user.getId(), jobId).isPresent();
        return toResponse(job, saved);
    }

    private JobResponse toResponse(Job job, boolean saved) {
        List<String> requirements = List.of(job.getRequirements().split(","));
        String applyUrl = job.getApplyUrl() != null
                ? job.getApplyUrl()
                : "https://www.linkedin.com/jobs/search/?keywords="
                        + URLEncoder.encode(job.getTitle(), StandardCharsets.UTF_8)
                        + "&location="
                        + URLEncoder.encode(job.getLocation(), StandardCharsets.UTF_8);
        return new JobResponse(
                job.getId(),
                new JobResponse.CompanySummary(
                        job.getCompany().getId(),
                        job.getCompany().getName(),
                        job.getCompany().getLogoUrl(),
                        job.getCompany().getIndustry(),
                        job.getCompany().getDescription()
                ),
                job.getTitle(),
                job.getLocation(),
                job.getJobType(),
                job.getSalary(),
                job.getPostedAt(),
                job.getDescription(),
                requirements,
                saved,
                applyUrl
        );
    }
}
