package com.jira.clone.models.dtos.project;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProjectMemberResponse {
    private Long userId;
    private String fullName;
    private String avatarUrl;
    private Long roleId;
    private String roleName;
}
