package com.npham.spinnode.modules.post.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreatePostRequest {

    @NotBlank(message = "content is required")
    @Size(max = 5000, message = "content must be <= 5000 characters")
    private String content;

    @Size(max = 500, message = "imageUrl must be <= 500 characters")
    private String imageUrl;
}