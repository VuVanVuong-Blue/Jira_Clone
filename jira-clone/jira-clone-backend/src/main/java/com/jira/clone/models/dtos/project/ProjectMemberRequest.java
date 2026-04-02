package com.jira.clone.models.dtos.project;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ProjectMemberRequest {
    @NotNull(message = "User ID is required")
    private Long userId;

    @NotNull(message = "Role ID is required")
    private Long roleId;
}
