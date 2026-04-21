package com.npham.spinnode.modules.post.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdatePostRequest {

    @Size(max = 5000, message = "content must be <= 5000 characters")
    private String content;
}