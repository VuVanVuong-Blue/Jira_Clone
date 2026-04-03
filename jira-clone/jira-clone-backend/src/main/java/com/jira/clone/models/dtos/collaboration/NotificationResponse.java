package com.jira.clone.models.dtos.collaboration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;
import com.jira.clone.models.enums.NotificationType;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NotificationResponse {
    private Long id;
    private Long actorId;
    private String actorName;
    private String actorAvatarUrl;
    private Long issueId;
    private String issueKey;
    private String issueSummary;
    private NotificationType type;
    private Boolean isRead;
    private LocalDateTime createdAt;
    
    // Invitation specific
    private String projectName;
    private Long invitationId;
    private String invitationStatus;
}
