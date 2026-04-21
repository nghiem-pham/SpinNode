package com.npham.spinnode.modules.search.dto.response;

public record SearchResultResponse(
        String id,
        String type,
        String title,
        String subtitle,
        String description,
        String logo,
        String location,
        String salary
) {}
