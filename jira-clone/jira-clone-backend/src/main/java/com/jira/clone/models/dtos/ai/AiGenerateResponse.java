package com.jira.clone.models.dtos.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AiGenerateResponse {
    private String generatedContent;
    private Integer totalTokensUsed;
}
