package com.jira.clone.models.dtos.auth;

import lombok.Data;

@Data
public class GoogleLoginRequest {
    private String idToken; // Google ID Token từ Google Sign-In SDK
}
