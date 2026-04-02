package com.jira.clone.models.dtos.issue;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import com.jira.clone.models.enums.StatusCategory;

@Data
public class StatusCreateRequest {
    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotBlank(message = "Status name is required")
    private String name;

    @NotNull(message = "Category is required")
    private StatusCategory category;

    private Integer boardPosition;
}
