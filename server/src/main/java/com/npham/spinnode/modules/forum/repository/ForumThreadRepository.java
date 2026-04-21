package com.npham.spinnode.modules.forum.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.forum.entity.ForumThread;

public interface ForumThreadRepository extends JpaRepository<ForumThread, Long> {

    List<ForumThread> findAllByOrderByIsPinnedDescLastActivityAtDesc();

    List<ForumThread> findByCategory_SlugOrderByIsPinnedDescLastActivityAtDesc(String slug);

    List<ForumThread> findByAuthor_IdOrderByCreatedAtDesc(Long authorId);
}
