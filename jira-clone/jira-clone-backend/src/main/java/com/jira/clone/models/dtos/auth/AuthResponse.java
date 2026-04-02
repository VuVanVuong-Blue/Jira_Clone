package com.jira.clone.models.dtos.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthResponse {
    private String accessToken; // JWT Token
    private String refreshToken; // Opaque token for rotation
    private UserProfileDTO user;
}
