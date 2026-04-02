package com.jira.clone.models.dtos.issue;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SprintCreateRequest {
    @NotNull(message = "Project ID is required")
    private Long projectId;

    @NotBlank(message = "Sprint name is required")
    private String name;

    private LocalDateTime startDate;
    private LocalDateTime endDate;
}
