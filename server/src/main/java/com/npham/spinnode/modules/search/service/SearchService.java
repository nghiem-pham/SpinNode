package com.npham.spinnode.modules.search.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.npham.spinnode.modules.company.repository.CompanyRepository;
import com.npham.spinnode.modules.job.repository.JobRepository;
import com.npham.spinnode.modules.search.dto.response.SearchResultResponse;
import com.npham.spinnode.modules.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SearchService {

    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<SearchResultResponse> search(String query) {
        String normalized = query == null ? "" : query.trim();
        if (normalized.isBlank()) {
            return List.of();
        }

        List<SearchResultResponse> results = new ArrayList<>();

        jobRepository.findByTitleContainingIgnoreCaseOrLocationContainingIgnoreCaseOrDescriptionContainingIgnoreCaseOrderByFeaturedOrderAscPostedAtDesc(
                        normalized,
                        normalized,
                        normalized
                )
                .forEach(job -> results.add(new SearchResultResponse(
                        "job-" + job.getId(),
                        "job",
                        job.getTitle(),
                        job.getCompany().getName(),
                        job.getDescription(),
                        job.getCompany().getLogoUrl(),
                        job.getLocation(),
                        job.getSalary()
                )));

        companyRepository.findByNameContainingIgnoreCaseOrIndustryContainingIgnoreCase(normalized, normalized)
                .forEach(company -> results.add(new SearchResultResponse(
                        "company-" + company.getId(),
                        "company",
                        company.getName(),
                        company.getIndustry(),
                        company.getDescription(),
                        company.getLogoUrl(),
                        null,
                        null
                )));

        userRepository.findByDisplayNameContainingIgnoreCaseOrEmailContainingIgnoreCase(normalized, normalized)
                .forEach(user -> results.add(new SearchResultResponse(
                        "user-" + user.getId(),
                        "user",
                        user.getDisplayName(),
                        user.getEmail(),
                        "Community member",
                        "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user.getEmail(),
                        null,
                        null
                )));

        return results;
    }
}
