package com.npham.spinnode.modules.post.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.post.entity.PostComment;

public interface PostCommentRepository extends JpaRepository<PostComment, Long> {

    List<PostComment> findByPost_IdOrderByCreatedAtAsc(Long postId);

    long countByPost_Id(Long postId);
}
