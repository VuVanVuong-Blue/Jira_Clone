package com.jira.clone.models.dtos.issue;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import com.jira.clone.models.enums.IssueLinkType;

@Data
public class IssueLinkCreateRequest {
    @NotNull
    private Long projectId;

    @NotNull
    private Long sourceIssueId;
    
    @NotNull
    private Long targetIssueId;
    
    @NotNull
    private IssueLinkType linkType;
}
