package com.npham.spinnode.modules.user.dto.response;

import java.time.Instant;

import com.npham.spinnode.modules.user.entity.UserRole;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserResponse {

    private Long id;
    private String email; 
    private String displayName;
    private UserRole role;
    private Instant createdAt;
}
