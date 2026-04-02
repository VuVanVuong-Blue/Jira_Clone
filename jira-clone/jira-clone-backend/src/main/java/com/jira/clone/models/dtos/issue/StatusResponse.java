package com.jira.clone.models.dtos.issue;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.jira.clone.models.enums.StatusCategory;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class StatusResponse {
    private Long id;
    private String name;
    private StatusCategory category;
    private Integer boardPosition;
}
