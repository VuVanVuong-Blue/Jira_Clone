package com.jira.clone.models.dtos.ai;

import lombok.Data;
import com.jira.clone.models.enums.AiToneOfVoice;

@Data
public class ProjectAiConfigRequest {
    private Boolean isAiEnabled;
    private String projectContext;
    private AiToneOfVoice toneOfVoice;
}
