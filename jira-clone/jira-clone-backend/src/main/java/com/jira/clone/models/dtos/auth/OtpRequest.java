package com.jira.clone.models.dtos.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import com.jira.clone.models.enums.OtpPurpose;

@Data
public class OtpRequest {
    @NotBlank(message = "Target identifier is required")
    private String targetIdentifier;

    private OtpPurpose purpose;
}
