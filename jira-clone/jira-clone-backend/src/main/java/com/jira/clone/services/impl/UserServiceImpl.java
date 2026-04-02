package com.jira.clone.services.impl;

import com.jira.clone.exceptions.ResourceNotFoundException;
import com.jira.clone.models.dtos.user.ChangePasswordRequest;
import com.jira.clone.models.dtos.user.UpdateProfileRequest;
import com.jira.clone.models.dtos.user.UserDto;
import com.jira.clone.models.entities.User;
import com.jira.clone.models.entities.UserAuthMethod;
import com.jira.clone.repositories.UserAuthMethodRepository;
import com.jira.clone.repositories.UserRepository;
import com.jira.clone.services.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserAuthMethodRepository authMethodRepository;
    private final PasswordEncoder passwordEncoder;

    public UserServiceImpl(UserRepository userRepository, UserAuthMethodRepository authMethodRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.authMethodRepository = authMethodRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public UserDto getCurrentUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng này"));
        return mapToDto(user);
    }

    @Override
    @Transactional
    public UserDto updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng này"));

        if (request.getFullName() != null && !request.getFullName().trim().isEmpty()) {
            user.setFullName(request.getFullName().trim());
        }
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl());
        }

        userRepository.save(user);
        return mapToDto(user);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy người dùng"));

        UserAuthMethod emailAuth = user.getAuthMethods().stream()
                .filter(m -> "email".equalsIgnoreCase(m.getAuthType().name()))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không đăng nhập bằng Email, không thể đổi mật khẩu"));

        if (!passwordEncoder.matches(request.getOldPassword(), emailAuth.getPasswordHash())) {
            throw new IllegalArgumentException("Mật khẩu cũ không chính xác");
        }

        emailAuth.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        authMethodRepository.save(emailAuth);
    }

    @Override
    public List<UserDto> searchUsers(String query) {
        List<User> users;
        if (query == null || query.trim().isEmpty()) {
            users = userRepository.findAll();
        } else {
            users = userRepository.findByFullNameContainingIgnoreCase(query.trim());
        }
        return users.stream().map(this::mapToDto).collect(Collectors.toList());
    }

    private UserDto mapToDto(User user) {
        String email = user.getAuthMethods().stream()
                .filter(a -> "email".equalsIgnoreCase(a.getAuthType().name()) || "google".equalsIgnoreCase(a.getAuthType().name()))
                .map(UserAuthMethod::getIdentifier)
                .findFirst()
                .orElse(null);

        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(email)
                .avatarUrl(user.getAvatarUrl())
                .globalRole(user.getGlobalRole().name())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
