package com.npham.spinnode.modules.follow.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.npham.spinnode.modules.follow.dto.response.FollowResponse;
import com.npham.spinnode.modules.follow.entity.UserFollow;
import com.npham.spinnode.modules.follow.repository.UserFollowRepository;
import com.npham.spinnode.modules.user.entity.User;
import com.npham.spinnode.modules.user.service.UserService;

import lombok.RequiredArgsConstructor;

import static org.springframework.http.HttpStatus.BAD_REQUEST;

@Service
@RequiredArgsConstructor
public class FollowService {

    private final UserFollowRepository userFollowRepository;
    private final UserService userService;

    @Transactional
    public FollowResponse toggleFollow(String email, Long targetUserId) {
        User follower = userService.getRequiredByEmail(email);

        if (follower.getId().equals(targetUserId)) {
            throw new ResponseStatusException(BAD_REQUEST, "Cannot follow yourself");
        }

        User following = userService.getRequiredById(targetUserId);

        Optional<UserFollow> existing = userFollowRepository.findByFollower_IdAndFollowing_Id(follower.getId(), targetUserId);
        boolean nowFollowing;

        if (existing.isPresent()) {
            userFollowRepository.delete(existing.get());
            nowFollowing = false;
        } else {
            userFollowRepository.save(UserFollow.builder()
                    .follower(follower)
                    .following(following)
                    .build());
            nowFollowing = true;
        }

        return new FollowResponse(
                targetUserId,
                nowFollowing,
                userFollowRepository.countByFollowing_Id(targetUserId),
                userFollowRepository.countByFollower_Id(targetUserId)
        );
    }

    @Transactional(readOnly = true)
    public boolean isFollowing(Long followerId, Long followingId) {
        return userFollowRepository.existsByFollower_IdAndFollowing_Id(followerId, followingId);
    }

    @Transactional(readOnly = true)
    public long getFollowersCount(Long userId) {
        return userFollowRepository.countByFollowing_Id(userId);
    }

    @Transactional(readOnly = true)
    public long getFollowingCount(Long userId) {
        return userFollowRepository.countByFollower_Id(userId);
    }

    @Transactional(readOnly = true)
    public List<UserFollow> getFollowers(Long userId) {
        return userFollowRepository.findByFollowing_Id(userId);
    }

    @Transactional(readOnly = true)
    public List<UserFollow> getFollowing(Long userId) {
        return userFollowRepository.findByFollower_Id(userId);
    }
}
