package com.npham.spinnode.modules.forum.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.forum.entity.ThreadUpvote;

public interface ThreadUpvoteRepository extends JpaRepository<ThreadUpvote, Long> {

    Optional<ThreadUpvote> findByThread_IdAndUser_Id(Long threadId, Long userId);

    boolean existsByThread_IdAndUser_Id(Long threadId, Long userId);

    List<ThreadUpvote> findByUser_IdOrderByIdDesc(Long userId);
}
