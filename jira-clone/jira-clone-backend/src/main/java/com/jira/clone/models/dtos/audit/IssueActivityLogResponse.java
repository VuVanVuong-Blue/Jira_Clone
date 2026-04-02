package com.jira.clone.models.dtos.audit;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IssueActivityLogResponse {
    private Long id;
    private Long userId;
    private String userFullName;
    private String userAvatarUrl;
    private Long issueId;
    private String issueKey;
    private String issueSummary;
    private Long projectId;
    private String projectName;
    private String actionType;
    private Object payload; // Sends the JSON native object straight to frontend
    private LocalDateTime createdAt;
}
