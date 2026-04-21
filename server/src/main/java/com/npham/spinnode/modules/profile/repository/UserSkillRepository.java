package com.npham.spinnode.modules.profile.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.profile.entity.UserSkill;

public interface UserSkillRepository extends JpaRepository<UserSkill, Long> {

    List<UserSkill> findByProfile_UserIdOrderByDisplayOrderAscIdAsc(Long userId);

    void deleteByProfile_UserId(Long userId);
}
