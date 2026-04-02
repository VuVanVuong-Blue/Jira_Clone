package com.jira.clone.models.dtos.issue;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import com.jira.clone.models.enums.IssueType;
import com.jira.clone.models.enums.IssuePriority;
import java.time.LocalDateTime;

@Data
public class IssueCreateRequest {
    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotNull(message = "Type is required")
    private IssueType type;

    private IssuePriority priority;

    @NotBlank(message = "Summary is required")
    private String summary;

    private String description;
    
    private Long assigneeId;
    private Long sprintId;
    private Long parentIssueId;
    
    // Hỗ trợ tạo Issue tức thì tại 1 cột cụ thể (Thay vì nhét hết vào cột đầu tiên)
    private Long statusId;
    
    private LocalDateTime startDate;
    private LocalDateTime dueDate;
}
