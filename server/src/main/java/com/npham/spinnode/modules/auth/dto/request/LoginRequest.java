package com.npham.spinnode.modules.auth.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
public class LoginRequest {
  @NotBlank
  private String email;

  @NotBlank
  private String password;
}
