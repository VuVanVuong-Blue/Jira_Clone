package com.jira.clone.models.dtos.collaboration;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class CommentCreateRequest {
    @NotNull(message = "Issue ID is required")
    private Long issueId;

    @NotBlank(message = "Content is required")
    private String content;
}
