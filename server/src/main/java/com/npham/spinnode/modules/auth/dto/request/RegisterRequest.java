package com.npham.spinnode.modules.auth.dto.request;

import com.npham.spinnode.modules.user.entity.UserRole;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
public class RegisterRequest {

  @NotBlank
  @Email
  @Size(max = 120)
  private String email;

  @NotBlank
  @Size(max = 50)
  private String displayName;

  @NotBlank
  @Size(min = 8, max = 72)
  private String password;

  @NotNull
  private UserRole role;
}
