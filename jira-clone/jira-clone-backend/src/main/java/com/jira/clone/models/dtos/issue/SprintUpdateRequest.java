package com.jira.clone.models.dtos.issue;

import com.jira.clone.models.enums.SprintStatus;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class SprintUpdateRequest {
    private String name;

    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private SprintStatus status;
}
