package com.jira.clone.models.dtos.issue;

import lombok.Data;
import com.jira.clone.models.enums.IssueType;
import com.jira.clone.models.enums.IssuePriority;
import java.time.LocalDateTime;

@Data
public class IssueUpdateRequest {
    private String summary;
    private String description;
    private IssueType type;
    private IssuePriority priority;
    private Long assigneeId;
    private Long statusId;
    private LocalDateTime startDate;
    private LocalDateTime dueDate;
}
