package com.npham.spinnode.modules.follow.repository;

import java.util.Optional;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.follow.entity.UserFollow;

public interface UserFollowRepository extends JpaRepository<UserFollow, Long> {

    Optional<UserFollow> findByFollower_IdAndFollowing_Id(Long followerId, Long followingId);

    boolean existsByFollower_IdAndFollowing_Id(Long followerId, Long followingId);

    List<UserFollow> findByFollower_Id(Long followerId);

    List<UserFollow> findByFollowing_Id(Long followingId);

    long countByFollower_Id(Long followerId);

    long countByFollowing_Id(Long followingId);
}
