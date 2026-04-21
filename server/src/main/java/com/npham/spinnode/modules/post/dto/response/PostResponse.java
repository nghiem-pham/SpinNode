package com.npham.spinnode.modules.post.dto.response;

import java.time.Instant;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class PostResponse {

    private Long id;
    private String content;
    private String imageUrl;
    private Instant createdAt;

    private Long authorId;
    private String authorEmail;
    private String authorDisplayName;
    private String authorAvatar;

    private long likesCount;
    private long commentsCount;
    private boolean likedByMe;
}