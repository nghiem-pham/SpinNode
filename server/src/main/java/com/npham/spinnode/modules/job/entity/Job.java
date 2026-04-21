package com.npham.spinnode.modules.job.entity;

import java.time.Instant;

import com.npham.spinnode.modules.company.entity.Company;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
@Table(name = "jobs")
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id")
    private Company company;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 120)
    private String location;

    @Column(nullable = false, length = 60)
    private String jobType;

    @Column(nullable = false, length = 80)
    private String salary;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String requirements;

    @Column(nullable = false)
    private Instant postedAt;

    @Column(nullable = false)
    private Integer featuredOrder;

    /** Direct link to the external hiring page. Null for fictional/seeded companies. */
    @Column(length = 500)
    private String applyUrl;
}
