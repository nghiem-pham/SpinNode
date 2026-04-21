package com.npham.spinnode.modules.forum.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.forum.entity.ForumCategory;

public interface ForumCategoryRepository extends JpaRepository<ForumCategory, Long> {

    Optional<ForumCategory> findBySlug(String slug);
}
