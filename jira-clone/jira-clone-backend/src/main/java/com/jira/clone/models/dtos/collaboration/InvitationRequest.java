package com.jira.clone.models.dtos.collaboration;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InvitationRequest {
    private Long recipientId;
    private Long roleId;
}
