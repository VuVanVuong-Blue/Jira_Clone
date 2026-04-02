package com.jira.clone.models.dtos.collaboration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AttachmentResponse {
    private Long id;
    private Long issueId;
    private Long uploaderId;
    private String uploaderName;
    private String fileName;
    private String fileUrl;
    private Integer fileSize;
    private String fileType;
    private LocalDateTime uploadedAt;
}
