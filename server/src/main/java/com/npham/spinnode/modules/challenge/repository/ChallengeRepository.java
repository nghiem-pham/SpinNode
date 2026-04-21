package com.npham.spinnode.modules.challenge.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.challenge.entity.Challenge;

public interface ChallengeRepository extends JpaRepository<Challenge, Long> {

    Optional<Challenge> findFirstByDailyDateOrderByIdAsc(LocalDate date);

    List<Challenge> findByDailyDateIsNullOrderByIdAsc();

    /** Fallback: most recently scheduled daily challenge (for when today's is missing). */
    Optional<Challenge> findTopByDailyDateIsNotNullOrderByDailyDateDesc();
}
