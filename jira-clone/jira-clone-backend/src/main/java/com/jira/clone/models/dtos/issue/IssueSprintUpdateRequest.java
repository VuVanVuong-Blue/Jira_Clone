package com.jira.clone.models.dtos.issue;

import lombok.Data;

@Data
public class IssueSprintUpdateRequest {
    private Long sprintId; // If null, means moving to backlog
}
