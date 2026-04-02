package com.jira.clone.models.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank(message = "Full name is required")
    private String fullName;

    @NotBlank(message = "Identifier (email/phone) is required")
    private String identifier;

    @NotBlank(message = "Password is required")
    private String password;

}
