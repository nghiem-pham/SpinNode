package com.npham.spinnode.modules.recruiter.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.recruiter.entity.RecruiterJobPosting;

public interface RecruiterJobPostingRepository extends JpaRepository<RecruiterJobPosting, Long> {
    List<RecruiterJobPosting> findByRecruiterUserIdOrderByPostedAtDesc(Long recruiterUserId);
}
