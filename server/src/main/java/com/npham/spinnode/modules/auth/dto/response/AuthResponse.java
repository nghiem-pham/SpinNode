package com.npham.spinnode.modules.auth.dto.response;

import com.npham.spinnode.modules.user.entity.UserRole;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthResponse {
  private String accessToken;
  private String tokenType; // "Bearer"
  private UserRole role;
}
