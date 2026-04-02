package com.jira.clone.models.dtos.project;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import com.jira.clone.models.enums.TemplateType;

@Data
public class ProjectCreateRequest {
    @NotBlank(message = "Project name is required")
    private String name;

    @NotBlank(message = "Key prefix is required")
    private String keyPrefix;

    @NotNull(message = "Template type is required")
    private TemplateType templateType;
    
    // leadUserId will typically be extracted from the authenticated user token
}
