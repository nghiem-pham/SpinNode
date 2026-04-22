package com.npham.spinnode.modules.profile.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.profile.entity.Experience;

public interface ExperienceRepository extends JpaRepository<Experience, Long> {

    List<Experience> findByProfile_UserIdOrderByDisplayOrderAscIdAsc(Long userId);

    void deleteByProfile_UserId(Long userId);
}
