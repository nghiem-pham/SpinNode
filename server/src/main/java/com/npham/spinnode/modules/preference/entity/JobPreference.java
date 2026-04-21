package com.npham.spinnode.modules.preference.entity;

import java.time.Instant;

import com.npham.spinnode.modules.user.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "job_preferences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobPreference {

    @Id
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    /** Entry / Mid / Senior / Lead */
    @Builder.Default
    @Column(nullable = false, length = 20)
    private String experienceLevel = "";

    /** Comma-separated job types, e.g. "Full-time,Contract" */
    @Builder.Default
    @Column(nullable = false, length = 200)
    private String jobTypes = "";

    /** On-site / Hybrid / Remote / Any */
    @Builder.Default
    @Column(nullable = false, length = 20)
    private String remotePref = "Any";

    /** Comma-separated locations, e.g. "San Francisco,New York" */
    @Builder.Default
    @Column(nullable = false, length = 500)
    private String preferredLocations = "";

    /** Comma-separated skills, e.g. "React,TypeScript,Node.js" */
    @Builder.Default
    @Column(nullable = false, length = 1000)
    private String preferredSkills = "";

    @Column
    private Integer salaryMin;

    @Column
    private Integer salaryMax;

    @Builder.Default
    @Column(nullable = false)
    private boolean onboardingComplete = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = updatedAt = Instant.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
