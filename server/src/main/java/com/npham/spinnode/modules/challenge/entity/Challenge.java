package com.npham.spinnode.modules.challenge.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "challenges")
public class Challenge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(nullable = false, length = 20)
    private String difficulty;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 255)
    private String topics;

    @Column(length = 20)
    private String acceptanceRate;

    @Column(length = 40)
    private String submissionsCount;

    @Column(nullable = false, length = 500)
    private String leetcodeUrl;

    private LocalDate dailyDate;
}
