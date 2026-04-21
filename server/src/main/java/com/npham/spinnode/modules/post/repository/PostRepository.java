package com.npham.spinnode.modules.post.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.post.entity.Post;

public interface PostRepository extends JpaRepository<Post, Long> {

    List<Post> findAllByOrderByCreatedAtDesc();

    List<Post> findByUser_IdOrderByCreatedAtDesc(Long userId);
}