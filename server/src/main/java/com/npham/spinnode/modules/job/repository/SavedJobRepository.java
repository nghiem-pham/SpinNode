package com.npham.spinnode.modules.job.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.job.entity.SavedJob;

public interface SavedJobRepository extends JpaRepository<SavedJob, Long> {

    Optional<SavedJob> findByUser_IdAndJob_Id(Long userId, Long jobId);

    List<SavedJob> findByUser_Id(Long userId);
}
