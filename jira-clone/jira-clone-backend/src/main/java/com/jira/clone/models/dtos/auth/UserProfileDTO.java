package com.jira.clone.models.dtos.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.jira.clone.models.enums.GlobalRole;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserProfileDTO {
    private Long id;
    private String fullName;
    private String avatarUrl;
    private GlobalRole globalRole;
}
