package com.jira.clone.models.dtos.project;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.jira.clone.models.enums.TemplateType;
import com.jira.clone.models.enums.ProjectStatus;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProjectResponse {
    private Long id;
    private String name;
    private String keyPrefix;
    private String iconUrl;
    private TemplateType templateType;
    private ProjectStatus status;
    private Long leadUserId;
}
