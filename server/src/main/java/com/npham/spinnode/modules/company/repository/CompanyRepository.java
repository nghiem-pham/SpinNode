package com.npham.spinnode.modules.company.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.npham.spinnode.modules.company.entity.Company;

public interface CompanyRepository extends JpaRepository<Company, Long> {

    List<Company> findByNameContainingIgnoreCaseOrIndustryContainingIgnoreCase(String nameQuery, String industryQuery);
}
