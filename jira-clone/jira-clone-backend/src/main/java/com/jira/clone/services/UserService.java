package com.jira.clone.services;

import com.jira.clone.models.dtos.user.ChangePasswordRequest;
import com.jira.clone.models.dtos.user.UpdateProfileRequest;
import com.jira.clone.models.dtos.user.UserDto;
import java.util.List;

public interface UserService {
    UserDto getCurrentUser(Long userId);
    UserDto updateProfile(Long userId, UpdateProfileRequest request);
    void changePassword(Long userId, ChangePasswordRequest request);
    List<UserDto> searchUsers(String query);
}
