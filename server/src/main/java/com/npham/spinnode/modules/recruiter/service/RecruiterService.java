package com.npham.spinnode.modules.recruiter.service;

import java.time.Instant;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.npham.spinnode.modules.recruiter.dto.JobPostRequest;
import com.npham.spinnode.modules.recruiter.dto.RecruiterJobPostingResponse;
import com.npham.spinnode.modules.recruiter.entity.RecruiterJobPosting;
import com.npham.spinnode.modules.recruiter.repository.RecruiterJobPostingRepository;
import com.npham.spinnode.modules.user.entity.User;
import com.npham.spinnode.modules.user.service.UserService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class RecruiterService {

    private final RecruiterJobPostingRepository recruiterJobPostingRepository;
    private final UserService userService;

    @Transactional
    public RecruiterJobPostingResponse createJobPosting(String email, JobPostRequest req) {
        User user = userService.getRequiredByEmail(email);
        RecruiterJobPosting posting = RecruiterJobPosting.builder()
                .recruiterUserId(user.getId())
                .title(req.title())
                .companyName(req.companyName())
                .location(req.location())
                .jobType(req.jobType() != null ? req.jobType() : "Full-time")
                .salary(req.salary())
                .description(req.description())
                .requirements(req.requirements())
                .applyUrl(req.applyUrl())
                .postedAt(Instant.now())
                .build();
        RecruiterJobPosting saved = recruiterJobPostingRepository.save(posting);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<RecruiterJobPostingResponse> getJobPostings(String email) {
        User user = userService.getRequiredByEmail(email);
        return recruiterJobPostingRepository.findByRecruiterUserIdOrderByPostedAtDesc(user.getId())
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private RecruiterJobPostingResponse toResponse(RecruiterJobPosting posting) {
        return new RecruiterJobPostingResponse(
                posting.getId(),
                posting.getRecruiterUserId(),
                posting.getTitle(),
                posting.getCompanyName(),
                posting.getLocation(),
                posting.getJobType(),
                posting.getSalary(),
                posting.getDescription(),
                posting.getRequirements(),
                posting.getApplyUrl(),
                posting.getPostedAt()
        );
    }
}
