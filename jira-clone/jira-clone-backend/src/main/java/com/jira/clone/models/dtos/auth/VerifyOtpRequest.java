package com.jira.clone.models.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyOtpRequest {
    @NotBlank(message = "Identifier (email/phone) is required")
    private String identifier;

    @NotBlank(message = "OTP code is required")
    private String otpCode;
}
