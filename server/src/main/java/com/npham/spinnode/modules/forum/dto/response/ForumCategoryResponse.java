package com.npham.spinnode.modules.forum.dto.response;

public record ForumCategoryResponse(
        Long id,
        String slug,
        String name,
        String description,
        String icon,
        int topics,
        int posts,
        String color
) {}
