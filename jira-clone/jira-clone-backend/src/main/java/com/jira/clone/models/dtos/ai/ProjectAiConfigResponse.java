package com.jira.clone.models.dtos.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import com.jira.clone.models.enums.AiToneOfVoice;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ProjectAiConfigResponse {
    private Long projectId;
    private Boolean isAiEnabled;
    private String projectContext;
    private AiToneOfVoice toneOfVoice;
    private LocalDateTime updatedAt;
}
