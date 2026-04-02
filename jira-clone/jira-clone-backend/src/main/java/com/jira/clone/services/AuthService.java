package com.jira.clone.services;

import com.jira.clone.models.dtos.auth.AuthResponse;
import com.jira.clone.models.dtos.auth.LoginRequest;
import com.jira.clone.models.dtos.auth.RegisterRequest;
import com.jira.clone.models.dtos.auth.OtpRequest;
import com.jira.clone.models.dtos.auth.ResetPasswordRequest;

import com.jira.clone.models.dtos.auth.VerifyOtpRequest;

public interface AuthService {
    void sendOtp(OtpRequest otpRequest);
    void registerUser(RegisterRequest registerRequest);
    AuthResponse verifyOtp(VerifyOtpRequest request);
    AuthResponse authenticateUser(LoginRequest loginRequest);
    AuthResponse refreshToken(String requestRefreshToken);
    AuthResponse googleLogin(String idToken);
    void resetPassword(ResetPasswordRequest resetPasswordRequest);
}
