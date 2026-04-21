package com.npham.spinnode.modules.forum.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateForumThreadRequest(
        @NotBlank String categorySlug,
        @NotBlank String title,
        @NotBlank String content,
        @NotNull List<String> tags
) {}
