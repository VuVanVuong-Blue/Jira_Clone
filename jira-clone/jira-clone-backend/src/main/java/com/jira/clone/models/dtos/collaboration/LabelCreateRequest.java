package com.jira.clone.models.dtos.collaboration;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class LabelCreateRequest {
    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotBlank(message = "Label name is required")
    private String name;

    private String colorHex;
}
