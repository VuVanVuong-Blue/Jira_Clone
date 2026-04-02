package com.jira.clone.models.dtos.audit;

import lombok.Data;

@Data
public class UserStarRequest {
    // Both are optional individually, but minimum 1 should be provided for starring
    private Long projectId;
    private Long issueId;
}
