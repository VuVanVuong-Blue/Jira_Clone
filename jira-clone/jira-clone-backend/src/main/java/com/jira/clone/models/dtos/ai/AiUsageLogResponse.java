package com.jira.clone.models.dtos.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import com.jira.clone.models.enums.AiFeature;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AiUsageLogResponse {
    private Long id;
    private Long userId;
    private String userName;
    private AiFeature featureUsed;
    private Integer promptTokens;
    private Integer completionTokens;
    private LocalDateTime createdAt;
}
