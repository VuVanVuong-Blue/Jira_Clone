package com.jira.clone.controllers;

import com.jira.clone.models.dtos.auth.*;
import com.jira.clone.services.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@Valid @RequestBody OtpRequest otpRequest) {
        authService.sendOtp(otpRequest);
        return ResponseEntity.ok(Map.of("message", "Mã OTP đã được gửi tới " + otpRequest.getTargetIdentifier()));
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest registerRequest) {
        authService.registerUser(registerRequest);
        return ResponseEntity.ok(Map.of("message", "Đăng ký thành công, vui lòng kiểm tra email để lấy mã OTP."));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<AuthResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request,
                                                   HttpServletResponse response) {
        AuthResponse authResponse = authService.verifyOtp(request);
        String rt = authResponse.getRefreshToken();
        setRefreshTokenCookie(response, rt);
        System.out.println("[AUTH] verifyOtp - User: " + request.getIdentifier());
        System.out.println("[AUTH] verifyOtp - AccessToken  (15c): " + authResponse.getAccessToken().substring(0, 15) + "...");
        System.out.println("[AUTH] verifyOtp - RefreshToken (8c) : " + rt.substring(0, 8) + "...  → set to HttpOnly Cookie");
        authResponse.setRefreshToken(null);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest loginRequest,
                                              HttpServletResponse response) {
        AuthResponse authResponse = authService.authenticateUser(loginRequest);
        String rt = authResponse.getRefreshToken();
        setRefreshTokenCookie(response, rt);
        System.out.println("[AUTH] login - User: " + loginRequest.getIdentifier());
        System.out.println("[AUTH] login - AccessToken  (15c): " + authResponse.getAccessToken().substring(0, 15) + "...");
        System.out.println("[AUTH] login - RefreshToken (8c) : " + rt.substring(0, 8) + "...  → set to HttpOnly Cookie");
        authResponse.setRefreshToken(null);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        // Đọc refresh token từ HttpOnly Cookie
        String refreshToken = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("refreshToken".equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        System.out.println("[AUTH] refresh - Cookie refreshToken found: " + (refreshToken != null ? "YES (" + refreshToken.substring(0, 8) + "...)" : "NO — cookie missing!"));

        if (refreshToken == null) {
            System.out.println("[AUTH] refresh - FAILED: No refresh token cookie");
            return ResponseEntity.status(401).body(Map.of("message", "Không tìm thấy refresh token. Hãy đăng nhập lại."));
        }

        AuthResponse authResponse = authService.refreshToken(refreshToken);
        String newRt = authResponse.getRefreshToken();
        setRefreshTokenCookie(response, newRt);
        System.out.println("[AUTH] refresh - SUCCESS: New tokens issued");
        System.out.println("[AUTH] refresh - New AccessToken  (15c): " + authResponse.getAccessToken().substring(0, 15) + "...");
        System.out.println("[AUTH] refresh - New RefreshToken (8c) : " + newRt.substring(0, 8) + "...  → rotated to HttpOnly Cookie");
        authResponse.setRefreshToken(null);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/google")
    public ResponseEntity<AuthResponse> googleLogin(@RequestBody GoogleLoginRequest request,
                                                     HttpServletResponse response) {
        AuthResponse authResponse = authService.googleLogin(request.getIdToken());
        String rt = authResponse.getRefreshToken();
        setRefreshTokenCookie(response, rt);
        System.out.println("[AUTH] googleLogin - User logged in via Google");
        System.out.println("[AUTH] googleLogin - AccessToken  (15c): " + authResponse.getAccessToken().substring(0, 15) + "...");
        System.out.println("[AUTH] googleLogin - RefreshToken (8c) : " + rt.substring(0, 8) + "...  → set to HttpOnly Cookie");
        authResponse.setRefreshToken(null);
        return ResponseEntity.ok(authResponse);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse response) {
        // Xóa cookie bằng cách set maxAge = 0
        Cookie cookie = new Cookie("refreshToken", "");
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // true khi production HTTPS
        cookie.setPath("/api/auth/refresh");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
        System.out.println("[AUTH] logout - RefreshToken cookie cleared");
        return ResponseEntity.ok(Map.of("message", "Đăng xuất thành công."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request);
        System.out.println("[AUTH] resetPassword - Password reset for: " + request.getIdentifier());
        return ResponseEntity.ok(Map.of("message", "Đã đặt lại mật khẩu thành công! Hãy đăng nhập lại."));
    }

    // ─── Helper: Set Refresh Token vào HttpOnly Cookie ───
    private void setRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie("refreshToken", refreshToken);
        cookie.setHttpOnly(true);           // JS không đọc được → chống XSS
        cookie.setSecure(false);            // Đổi thành true khi deploy HTTPS
        cookie.setPath("/api/auth/refresh"); // Chỉ gửi khi gọi endpoint refresh
        cookie.setMaxAge(30 * 24 * 60 * 60); // 30 ngày
        response.addCookie(cookie);
    }
}
