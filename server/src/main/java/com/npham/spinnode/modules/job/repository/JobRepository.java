package com.npham.spinnode.modules.job.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.job.entity.Job;

public interface JobRepository extends JpaRepository<Job, Long> {

    List<Job> findAllByOrderByFeaturedOrderAscPostedAtDesc();

    List<Job> findByTitleContainingIgnoreCaseOrLocationContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrderByFeaturedOrderAscPostedAtDesc(
            String titleQuery,
            String locationQuery,
            String descriptionQuery
    );
}
