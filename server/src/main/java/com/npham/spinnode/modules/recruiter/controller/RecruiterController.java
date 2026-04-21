package com.npham.spinnode.modules.recruiter.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.npham.spinnode.modules.recruiter.dto.JobPostRequest;
import com.npham.spinnode.modules.recruiter.dto.RecruiterJobPostingResponse;
import com.npham.spinnode.modules.recruiter.service.RecruiterService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/recruiter")
@RequiredArgsConstructor
public class RecruiterController {

    private final RecruiterService recruiterService;

    @PostMapping("/jobs")
    public RecruiterJobPostingResponse createJobPosting(Principal principal,
                                                        @RequestBody JobPostRequest req) {
        return recruiterService.createJobPosting(principal.getName(), req);
    }

    @GetMapping("/jobs")
    public List<RecruiterJobPostingResponse> getJobPostings(Principal principal) {
        return recruiterService.getJobPostings(principal.getName());
    }
}
