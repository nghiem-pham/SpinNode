package com.npham.spinnode.modules.job.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.npham.spinnode.modules.job.dto.response.JobResponse;
import com.npham.spinnode.modules.job.service.JobService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    @GetMapping
    public List<JobResponse> getJobs(Principal principal) {
        return jobService.getJobs(principal.getName());
    }

    @PostMapping("/{jobId}/save")
    public JobResponse toggleSavedJob(Principal principal, @PathVariable Long jobId) {
        return jobService.toggleSavedJob(principal.getName(), jobId);
    }
}
