package com.jira.clone.controllers;

import com.jira.clone.models.dtos.user.ChangePasswordRequest;
import com.jira.clone.models.dtos.user.UpdateProfileRequest;
import com.jira.clone.models.dtos.user.UserDto;
import com.jira.clone.services.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;


//Controller xử lý các API liên quan đến user
@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }
    //API lấy thông tin user hiện tại
    @GetMapping("/me")
    public ResponseEntity<UserDto> getCurrentUser(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(userService.getCurrentUser(userId));
    }
    //API cập nhật thông tin user
    @PutMapping("/me")
    public ResponseEntity<UserDto> updateProfile(Authentication authentication, @Valid @RequestBody UpdateProfileRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        return ResponseEntity.ok(userService.updateProfile(userId, request));
    }
    //API đổi mật khẩu
    @PutMapping("/me/password")
    public ResponseEntity<?> changePassword(Authentication authentication, @Valid @RequestBody ChangePasswordRequest request) {
        Long userId = (Long) authentication.getPrincipal();
        userService.changePassword(userId, request);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }
    //API tìm kiếm user
    @GetMapping("/search")
    public ResponseEntity<List<UserDto>> searchUsers(@RequestParam(required = false) String q) {
        return ResponseEntity.ok(userService.searchUsers(q));
    }
}
