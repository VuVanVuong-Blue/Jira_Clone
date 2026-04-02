package com.jira.clone.models.dtos.ai;

import lombok.Data;
import jakarta.validation.constraints.NotNull;
import com.jira.clone.models.enums.AiFeature;

@Data
public class AiGenerateRequest {
    @NotNull(message = "Project ID is required for context")
    private Long projectId;
    
    @NotNull(message = "Issue ID is required")
    private Long issueId;

    @NotNull(message = "Feature type is required")
    private AiFeature featureUsed;

    // Custom prompt appendable modifier from Frontend 
    private String customPrompt;
}
