package com.jira.clone.models.dtos.issue;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import com.jira.clone.models.enums.IssueLinkType;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class IssueLinkResponse {
    private Long id;
    private Long sourceIssueId;
    private Long targetIssueId;
    private IssueLinkType linkType;
}
