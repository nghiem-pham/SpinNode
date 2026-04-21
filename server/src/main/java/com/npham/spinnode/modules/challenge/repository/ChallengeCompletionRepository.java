package com.npham.spinnode.modules.challenge.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.challenge.entity.ChallengeCompletion;

public interface ChallengeCompletionRepository extends JpaRepository<ChallengeCompletion, Long> {

    Optional<ChallengeCompletion> findByUser_IdAndChallenge_Id(Long userId, Long challengeId);

    List<ChallengeCompletion> findByUser_IdOrderByCompletedAtDesc(Long userId);

    long countByUser_Id(Long userId);

    long countByUser_IdAndCompletedAtAfter(Long userId, Instant completedAfter);
}
