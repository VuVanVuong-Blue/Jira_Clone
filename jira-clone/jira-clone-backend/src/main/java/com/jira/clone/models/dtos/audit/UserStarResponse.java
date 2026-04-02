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
public class UserStarResponse {
    private Long id;
    private Long projectId;
    private String projectName; 
    private String projectIconUrl;
    private Long issueId;
    private String issueKey; 
    private String issueSummary; 
    private LocalDateTime createdAt;
}
