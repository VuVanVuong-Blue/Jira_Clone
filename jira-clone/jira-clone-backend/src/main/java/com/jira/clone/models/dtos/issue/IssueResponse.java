package com.jira.clone.models.dtos.issue;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import com.jira.clone.models.enums.IssueType;
import com.jira.clone.models.enums.IssuePriority;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IssueResponse {
    private Long id;
    private Long projectId;
    private String projectName;
    private String issueKey; // Vd: TAT-123
    private IssueType type;
    private IssuePriority priority;
    private String summary;
    private String description;
    
    private Long statusId;
    private String statusName;
    
    private Long parentIssueId; // Cho parent-child relationships (Subtasks)

    private Long assigneeId;
    private String assigneeName;
    private String assigneeAvatarUrl;
    
    private Long reporterId;
    private String reporterName;
    private String reporterAvatarUrl;
    
    private String boardPosition; // LexoRank string
    private Integer version; // For optimistic locking
    
    private Long sprintId;
    private String sprintName;
    
    private LocalDateTime createdAt;
    private LocalDateTime startDate;
    private LocalDateTime dueDate;

    @Builder.Default
    private java.util.List<IssueResponse> subtasks = new java.util.ArrayList<>();
}
