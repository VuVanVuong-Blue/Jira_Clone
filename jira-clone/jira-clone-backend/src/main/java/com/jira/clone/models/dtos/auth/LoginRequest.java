package com.jira.clone.models.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {
    @NotBlank(message = "Identifier is required")
    private String identifier; // email or phone

    @NotBlank(message = "Password is required")
    private String password;
}
