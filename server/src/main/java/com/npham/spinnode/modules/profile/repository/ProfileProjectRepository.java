package com.npham.spinnode.modules.profile.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.profile.entity.ProfileProject;

public interface ProfileProjectRepository extends JpaRepository<ProfileProject, Long> {

    List<ProfileProject> findByProfile_UserIdOrderByDisplayOrderAscIdAsc(Long userId);

    void deleteByProfile_UserId(Long userId);
}
