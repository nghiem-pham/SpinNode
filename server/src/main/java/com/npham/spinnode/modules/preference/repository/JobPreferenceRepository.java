package com.npham.spinnode.modules.preference.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.preference.entity.JobPreference;

public interface JobPreferenceRepository extends JpaRepository<JobPreference, Long> {
    Optional<JobPreference> findByUser_Id(Long userId);
}
