package com.npham.spinnode.modules.forum.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.forum.entity.ForumReply;

public interface ForumReplyRepository extends JpaRepository<ForumReply, Long> {

    List<ForumReply> findByThread_IdOrderByCreatedAtAsc(Long threadId);

    List<ForumReply> findByAuthor_IdOrderByCreatedAtDesc(Long authorId);
}
