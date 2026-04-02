package com.jira.clone.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jira.clone.models.dtos.collaboration.*;
import com.jira.clone.models.entities.*;
import com.jira.clone.repositories.*;
import com.jira.clone.security.annotations.CheckProjectPermission;
import com.jira.clone.models.enums.Resource;
import com.jira.clone.models.enums.Action;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class CollaborationController {

    private final CommentRepository commentRepository;
    private final LabelRepository labelRepository;
    private final AttachmentRepository attachmentRepository;
    private final IssueRepository issueRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final IssueActivityLogRepository activityLogRepository;
    private final ObjectMapper objectMapper;

    public CollaborationController(CommentRepository commentRepository,
                                    LabelRepository labelRepository,
                                    AttachmentRepository attachmentRepository,
                                    IssueRepository issueRepository,
                                    UserRepository userRepository,
                                    ProjectRepository projectRepository,
                                    IssueActivityLogRepository activityLogRepository,
                                    ObjectMapper objectMapper) {
        this.commentRepository = commentRepository;
        this.labelRepository = labelRepository;
        this.attachmentRepository = attachmentRepository;
        this.issueRepository = issueRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.activityLogRepository = activityLogRepository;
        this.objectMapper = objectMapper;
    }

    // ═══════ COMMENT ═══════

    @PostMapping("/comments")
    @CheckProjectPermission(resource = Resource.COMMENT, action = Action.CREATE, issueIdParam = "request")
    public ResponseEntity<CommentResponse> createComment(
            @Valid @RequestBody CommentCreateRequest request, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        Issue issue = issueRepository.findById(request.getIssueId())
                .orElseThrow(() -> new RuntimeException("Issue không tồn tại."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại."));

        Comment comment = Comment.builder()
                .issue(issue).user(user).content(request.getContent()).build();
        comment = commentRepository.save(comment);

        // Log Activity
        try {
            java.util.Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("contentSnippet", comment.getContent().length() > 50 ? comment.getContent().substring(0, 50) + "..." : comment.getContent());
            
            activityLogRepository.save(IssueActivityLog.builder()
                    .issue(issue).user(user).actionType("COMMENT")
                    .payload(objectMapper.writeValueAsString(payload)).build());
        } catch (Exception e) {}

        return ResponseEntity.ok(CommentResponse.builder()
                .id(comment.getId()).issueId(issue.getId())
                .userId(user.getId()).userFullName(user.getFullName())
                .userAvatarUrl(user.getAvatarUrl())
                .content(comment.getContent())
                .createdAt(comment.getCreatedAt()).updatedAt(comment.getUpdatedAt())
                .build());
    }

    @GetMapping("/comments/issue/{issueId}")
    @CheckProjectPermission(resource = Resource.COMMENT, action = Action.VIEW, issueIdParam = "issueId")
    public ResponseEntity<List<CommentResponse>> getComments(@PathVariable Long issueId) {
        return ResponseEntity.ok(commentRepository.findByIssueIdOrderByCreatedAtAsc(issueId)
                .stream().map(c -> CommentResponse.builder()
                        .id(c.getId()).issueId(c.getIssue().getId())
                        .userId(c.getUser().getId()).userFullName(c.getUser().getFullName())
                        .userAvatarUrl(c.getUser().getAvatarUrl())
                        .content(c.getContent())
                        .createdAt(c.getCreatedAt()).updatedAt(c.getUpdatedAt())
                        .build())
                .collect(java.util.stream.Collectors.toList()));
    }

    // ═══════ LABEL ═══════

    @PostMapping("/labels")
    @CheckProjectPermission(resource = Resource.SETTINGS, action = Action.CREATE, projectIdParam = "request")
    public ResponseEntity<LabelResponse> createLabel(@Valid @RequestBody LabelCreateRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project không tồn tại."));
        Label label = Label.builder()
                .project(project).name(request.getName())
                .colorHex(request.getColorHex() != null ? request.getColorHex() : "#0052CC")
                .build();
        label = labelRepository.save(label);
        return ResponseEntity.ok(LabelResponse.builder()
                .id(label.getId()).name(label.getName()).colorHex(label.getColorHex()).build());
    }

    @GetMapping("/labels/project/{projectId}")
    @CheckProjectPermission(resource = Resource.SETTINGS, action = Action.VIEW, projectIdParam = "projectId")
    public ResponseEntity<List<LabelResponse>> getLabels(@PathVariable Long projectId) {
        return ResponseEntity.ok(labelRepository.findByProjectId(projectId)
                .stream().map(l -> LabelResponse.builder()
                        .id(l.getId()).name(l.getName()).colorHex(l.getColorHex()).build())
                .collect(Collectors.toList()));
    }

    // ═══════ ATTACHMENT ═══════

    @GetMapping("/attachments/issue/{issueId}")
    @CheckProjectPermission(resource = Resource.ISSUE, action = Action.VIEW, issueIdParam = "issueId")
    public ResponseEntity<List<AttachmentResponse>> getAttachments(@PathVariable Long issueId) {
        return ResponseEntity.ok(attachmentRepository.findByIssueIdOrderByUploadedAtDesc(issueId)
                .stream().map(a -> AttachmentResponse.builder()
                        .id(a.getId()).issueId(issueId)
                        .uploaderId(a.getUploader().getId()).uploaderName(a.getUploader().getFullName())
                        .fileName(a.getFileName()).fileUrl(a.getFileUrl())
                        .fileSize(a.getFileSize()).fileType(a.getFileType())
                        .uploadedAt(a.getUploadedAt())
                        .build())
                .collect(Collectors.toList()));
    }

    @PostMapping("/attachments/upload")
    @CheckProjectPermission(resource = Resource.ISSUE, action = Action.EDIT, issueIdParam = "issueId")
    public ResponseEntity<AttachmentResponse> uploadAttachment(
            @RequestParam("file") MultipartFile file,
            @RequestParam("issueId") Long issueId,
            Authentication auth) throws IOException {
        
        Long userId = (Long) auth.getPrincipal();
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue không tồn tại."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại."));

        String uploadDir = "uploads/attachments/";
        File dir = new File(uploadDir);
        if (!dir.exists()) dir.mkdirs();

        String originalName = file.getOriginalFilename();
        String fileName = UUID.randomUUID().toString() + "_" + originalName;
        Path filePath = Paths.get(uploadDir, fileName);
        Files.copy(file.getInputStream(), filePath);

        Attachment attachment = Attachment.builder()
                .issue(issue)
                .uploader(user)
                .fileName(originalName)
                .fileUrl("/" + uploadDir + fileName)
                .fileSize((int) file.getSize())
                .fileType(file.getContentType())
                .build();
        attachment = attachmentRepository.save(attachment);

        return ResponseEntity.ok(AttachmentResponse.builder()
                .id(attachment.getId()).issueId(issueId)
                .uploaderId(user.getId()).uploaderName(user.getFullName())
                .fileName(originalName).fileUrl(attachment.getFileUrl())
                .fileSize(attachment.getFileSize()).fileType(attachment.getFileType())
                .uploadedAt(attachment.getUploadedAt())
                .build());
    }
}
