package com.jira.clone.services.impl;

import com.jira.clone.models.dtos.auth.*;
import com.jira.clone.models.entities.RefreshToken;
import com.jira.clone.models.entities.User;
import com.jira.clone.models.entities.UserAuthMethod;
import com.jira.clone.models.enums.AuthType;
import com.jira.clone.models.enums.GlobalRole;
import com.jira.clone.models.enums.OtpPurpose;
import com.jira.clone.repositories.RefreshTokenRepository;
import com.jira.clone.repositories.UserAuthMethodRepository;
import com.jira.clone.repositories.UserRepository;
import com.jira.clone.security.JwtUtils;
import com.jira.clone.services.AuthService;
import com.jira.clone.services.OtpService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final UserAuthMethodRepository userAuthMethodRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtils jwtUtils;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${jira.app.refreshTokenExpirationDays:30}")
    private int refreshTokenExpirationDays;

    @Value("${google.client.id:}")
    private String googleClientId;

    public AuthServiceImpl(UserRepository userRepository,
                           UserAuthMethodRepository userAuthMethodRepository,
                           RefreshTokenRepository refreshTokenRepository,
                           JwtUtils jwtUtils,
                           PasswordEncoder passwordEncoder,
                           OtpService otpService) {
        this.userRepository = userRepository;
        this.userAuthMethodRepository = userAuthMethodRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtUtils = jwtUtils;
        this.passwordEncoder = passwordEncoder;
        this.otpService = otpService;
    }

    // ═══════════════════════════════════════════════════
    // 1. GỬI OTP QUA EMAIL (BREVO)
    // ═══════════════════════════════════════════════════
    @Override
    public void sendOtp(OtpRequest otpRequest) {
        otpService.sendOtp(otpRequest.getTargetIdentifier(), otpRequest.getPurpose());
    }

    // ═══════════════════════════════════════════════════
    // 2. ĐĂNG KÝ TÀI KHOẢN MỚI
    // ═══════════════════════════════════════════════════
    @Override
    @Transactional
    public void registerUser(RegisterRequest registerRequest) {
        if (userAuthMethodRepository.existsByAuthTypeAndIdentifier(
                AuthType.email, registerRequest.getIdentifier())) {
            throw new RuntimeException("Email này đã được đăng ký.");
        }

        User user = User.builder()
                .fullName(registerRequest.getFullName())
                .globalRole(GlobalRole.user)
                .build();
        user = userRepository.save(user);

        UserAuthMethod authMethod = UserAuthMethod.builder()
                .user(user)
                .authType(AuthType.email)
                .identifier(registerRequest.getIdentifier())
                .passwordHash(passwordEncoder.encode(registerRequest.getPassword()))
                .isVerified(false) // Not verified yet
                .build();
        userAuthMethodRepository.save(authMethod);

        // Send OTP directly
        otpService.sendOtp(registerRequest.getIdentifier(), OtpPurpose.register);
    }

    // ═══════════════════════════════════════════════════
    // 2.5. XÁC MINH OTP
    // ═══════════════════════════════════════════════════
    @Override
    @Transactional
    public AuthResponse verifyOtp(VerifyOtpRequest request) {
        boolean otpValid = otpService.verifyOtp(request.getIdentifier(), request.getOtpCode());
        if (!otpValid) {
            throw new RuntimeException("Mã OTP không hợp lệ hoặc đã hết hạn.");
        }

        UserAuthMethod authMethod = userAuthMethodRepository
                .findByAuthTypeAndIdentifier(AuthType.email, request.getIdentifier())
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại."));

        // Update to verified
        authMethod.setIsVerified(true);
        userAuthMethodRepository.save(authMethod);

        User user = authMethod.getUser();

        String accessToken = jwtUtils.generateAccessToken(
                authMethod.getIdentifier(), user.getId(), user.getGlobalRole().name());
        RefreshToken refreshToken = createRefreshToken(user);

        return buildAuthResponse(accessToken, refreshToken.getToken(), user);
    }

    // ═══════════════════════════════════════════════════
    // 3. ĐĂNG NHẬP
    // ═══════════════════════════════════════════════════
    @Override
    @Transactional
    public AuthResponse authenticateUser(LoginRequest loginRequest) {
        UserAuthMethod authMethod = userAuthMethodRepository
                .findByAuthTypeAndIdentifier(AuthType.email, loginRequest.getIdentifier())
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại."));

        if (!passwordEncoder.matches(loginRequest.getPassword(), authMethod.getPasswordHash())) {
            throw new RuntimeException("Sai mật khẩu.");
        }

        User user = authMethod.getUser();
        String accessToken = jwtUtils.generateAccessToken(
                authMethod.getIdentifier(), user.getId(), user.getGlobalRole().name());
        RefreshToken refreshToken = createRefreshToken(user);

        return buildAuthResponse(accessToken, refreshToken.getToken(), user);
    }

    // ═══════════════════════════════════════════════════
    // 4. REFRESH TOKEN ROTATION + REUSE DETECTION
    // ═══════════════════════════════════════════════════
    @Override
    @Transactional
    public AuthResponse refreshToken(String requestRefreshToken) {
        Optional<RefreshToken> tokenOpt = refreshTokenRepository.findByToken(requestRefreshToken);
        if (tokenOpt.isEmpty()) {
            throw new RuntimeException("Refresh token không hợp lệ.");
        }

        RefreshToken existingToken = tokenOpt.get();

        if (existingToken.getIsRevoked()) {
            refreshTokenRepository.revokeAllUserTokens(existingToken.getUser().getId());
            throw new RuntimeException(
                "Cảnh báo bảo mật: Refresh Token đã bị sử dụng lại! "
                + "Toàn bộ phiên đăng nhập đã bị thu hồi.");
        }

        if (existingToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            refreshTokenRepository.delete(existingToken);
            throw new RuntimeException("Refresh token đã hết hạn. Hãy đăng nhập lại.");
        }

        User user = existingToken.getUser();
        existingToken.setIsRevoked(true);
        refreshTokenRepository.save(existingToken);

        // Sử dụng userId làm subject cho token mới
        String newAccessToken = jwtUtils.generateAccessToken(
                user.getId().toString(), user.getId(), user.getGlobalRole().name());
        RefreshToken newRefreshToken = createRefreshToken(user);

        return buildAuthResponse(newAccessToken, newRefreshToken.getToken(), user);
    }

    // ═══════════════════════════════════════════════════
    // 5. GOOGLE LOGIN (Verify ID Token → Auto Register/Login)
    // ═══════════════════════════════════════════════════
    @Override
    @Transactional
    public AuthResponse googleLogin(String idToken) {
        // Xác thực ID Token qua Google API
        Map<String, Object> googleUser = verifyGoogleIdToken(idToken);

        String email = (String) googleUser.get("email");
        String name = (String) googleUser.get("name");
        String picture = (String) googleUser.get("picture");

        if (email == null) {
            throw new RuntimeException("Không lấy được email từ Google.");
        }

        // Tìm hoặc tạo User + AuthMethod
        Optional<UserAuthMethod> existing = userAuthMethodRepository
                .findByAuthTypeAndIdentifier(AuthType.google, email);

        User user;
        if (existing.isPresent()) {
            // Đăng nhập lại
            user = existing.get().getUser();
            // Cập nhật avatar nếu thay đổi
            if (picture != null) {
                user.setAvatarUrl(picture);
                userRepository.save(user);
            }
        } else {
            // Tự tạo tài khoản mới (auto-register)
            user = User.builder()
                    .fullName(name != null ? name : email)
                    .avatarUrl(picture)
                    .globalRole(GlobalRole.user)
                    .build();
            user = userRepository.save(user);

            UserAuthMethod authMethod = UserAuthMethod.builder()
                    .user(user)
                    .authType(AuthType.google)
                    .identifier(email)
                    .isVerified(true)
                    .build();
            userAuthMethodRepository.save(authMethod);
        }

        String accessToken = jwtUtils.generateAccessToken(
                email, user.getId(), user.getGlobalRole().name());
        RefreshToken refreshToken = createRefreshToken(user);

        return buildAuthResponse(accessToken, refreshToken.getToken(), user);
    }

    // ═══════════════════════════════════════════════════
    // 6. QUÊN MẬT KHẨU (RESET PASSWORD)
    // ═══════════════════════════════════════════════════
    @Override
    @Transactional
    public void resetPassword(ResetPasswordRequest resetPasswordRequest) {
        // 1. Kiểm tra OTP
        boolean otpValid = otpService.verifyOtp(
                resetPasswordRequest.getIdentifier(), resetPasswordRequest.getOtpCode());
        if (!otpValid) {
            throw new RuntimeException("Mã OTP không hợp lệ hoặc đã hết hạn.");
        }

        // 2. Tìm UserAuthMethod liên kết với email này
        UserAuthMethod authMethod = userAuthMethodRepository
                .findByAuthTypeAndIdentifier(AuthType.email, resetPasswordRequest.getIdentifier())
                .orElseThrow(() -> new RuntimeException("Tài khoản không tồn tại để đặt lại mật khẩu."));

        // 3. Cập nhật mật khẩu mới (Mã hóa trước khi lưu)
        authMethod.setPasswordHash(passwordEncoder.encode(resetPasswordRequest.getNewPassword()));
        userAuthMethodRepository.save(authMethod);
        
        // 4. Thu hồi toàn bộ Refresh Token cũ để bảo mật
        refreshTokenRepository.revokeAllUserTokens(authMethod.getUser().getId());
    }

    /**
     * Gọi Google tokeninfo endpoint để xác thực ID Token.
     * Production nên dùng Google API Client Library.
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    private Map<String, Object> verifyGoogleIdToken(String idToken) {
        String url = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            Map<String, Object> body = response.getBody();

            if (body == null) {
                throw new RuntimeException("Token Google không hợp lệ.");
            }

            // Kiểm tra audience (aud) khớp với Client ID
            String aud = (String) body.get("aud");
            if (!googleClientId.equals(aud)) {
                throw new RuntimeException("Token Google không thuộc ứng dụng này.");
            }

            return body;
        } catch (Exception e) {
            throw new RuntimeException("Xác thực Google thất bại: " + e.getMessage());
        }
    }

    // ────────────── HELPER ──────────────

    private RefreshToken createRefreshToken(User user) {
        RefreshToken refreshToken = RefreshToken.builder()
                .user(user)
                .token(UUID.randomUUID().toString())
                .expiresAt(LocalDateTime.now().plusDays(refreshTokenExpirationDays))
                .isRevoked(false)
                .build();
        return refreshTokenRepository.save(refreshToken);
    }

    private AuthResponse buildAuthResponse(String accessToken, String refreshToken, User user) {
        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .user(UserProfileDTO.builder()
                        .id(user.getId())
                        .fullName(user.getFullName())
                        .avatarUrl(user.getAvatarUrl())
                        .globalRole(user.getGlobalRole())
                        .build())
                .build();
    }
}
