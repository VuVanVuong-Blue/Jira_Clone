package com.jira.clone.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jira.clone.models.dtos.audit.*;
import com.jira.clone.models.entities.*;
import com.jira.clone.repositories.*;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class AuditController {

    private final UserStarRepository userStarRepository;
    private final UserViewHistoryRepository userViewHistoryRepository;
    private final IssueActivityLogRepository issueActivityLogRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final IssueRepository issueRepository;
    private final ObjectMapper objectMapper;

    public AuditController(UserStarRepository userStarRepository,
                            UserViewHistoryRepository userViewHistoryRepository,
                            IssueActivityLogRepository issueActivityLogRepository,
                            UserRepository userRepository,
                            ProjectRepository projectRepository,
                            IssueRepository issueRepository,
                            ObjectMapper objectMapper) {
        this.userStarRepository = userStarRepository;
        this.userViewHistoryRepository = userViewHistoryRepository;
        this.issueActivityLogRepository = issueActivityLogRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.issueRepository = issueRepository;
        this.objectMapper = objectMapper;
    }

    // ═══════ USER STAR ═══════

    @PostMapping("/stars")
    public ResponseEntity<?> toggleStar(@Valid @RequestBody UserStarRequest request, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        User user = userRepository.findById(userId).orElseThrow();

        if (request.getProjectId() != null) {
            java.util.Optional<UserStar> existing = userStarRepository.findByUserIdAndProjectId(userId, request.getProjectId());
            if (existing.isPresent()) {
                userStarRepository.delete(existing.get());
                return ResponseEntity.ok(Map.of("message", "Đã bỏ đánh dấu sao dự án.", "starred", false));
            }
            UserStar star = UserStar.builder().user(user).project(projectRepository.findById(request.getProjectId()).orElseThrow()).build();
            userStarRepository.save(star);
            return ResponseEntity.ok(Map.of("message", "Đã đánh dấu sao dự án.", "starred", true));
        }

        if (request.getIssueId() != null) {
            java.util.Optional<UserStar> existing = userStarRepository.findByUserIdAndIssueId(userId, request.getIssueId());
            if (existing.isPresent()) {
                userStarRepository.delete(existing.get());
                return ResponseEntity.ok(Map.of("message", "Đã bỏ đánh dấu sao công việc.", "starred", false));
            }
            UserStar star = UserStar.builder().user(user).issue(issueRepository.findById(request.getIssueId()).orElseThrow()).build();
            userStarRepository.save(star);
            return ResponseEntity.ok(Map.of("message", "Đã đánh dấu sao công việc.", "starred", true));
        }

        return ResponseEntity.badRequest().body(Map.of("message", "Thiếu ID dự án hoặc công việc."));
    }

    @GetMapping("/stars")
    public ResponseEntity<List<UserStarResponse>> getStars(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(userStarRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(s -> UserStarResponse.builder()
                        .id(s.getId())
                        .projectId(s.getProject() != null ? s.getProject().getId() : null)
                        .projectName(s.getProject() != null ? s.getProject().getName() : null)
                        .projectIconUrl(s.getProject() != null ? s.getProject().getIconUrl() : null)
                        .issueId(s.getIssue() != null ? s.getIssue().getId() : null)
                        .issueKey(s.getIssue() != null ? s.getIssue().getIssueKey() : null)
                        .issueSummary(s.getIssue() != null ? s.getIssue().getSummary() : null)
                        .createdAt(s.getCreatedAt())
                        .build())
                .collect(Collectors.toList()));
    }

    @GetMapping("/view-history")
    public ResponseEntity<List<UserViewHistoryResponse>> getViewHistory(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(userViewHistoryRepository.findByUserIdOrderByViewedAtDesc(userId)
                .stream().map(h -> UserViewHistoryResponse.builder()
                        .id(h.getId())
                        .projectId(h.getProject() != null ? h.getProject().getId() : null)
                        .projectName(h.getProject() != null ? h.getProject().getName() : null)
                        .issueId(h.getIssue() != null ? h.getIssue().getId() : null)
                        .issueKey(h.getIssue() != null ? h.getIssue().getIssueKey() : null)
                        .issueSummary(h.getIssue() != null ? h.getIssue().getSummary() : null)
                        .viewedAt(h.getViewedAt())
                        .build())
                .collect(Collectors.toList()));
    }

    // ═══════ ACTIVITY LOG ═══════

    @GetMapping("/activity-logs/my")
    public ResponseEntity<List<IssueActivityLogResponse>> getMyActivityLogs(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(issueActivityLogRepository.findByUserIdOrderByCreatedAtDesc(userId, org.springframework.data.domain.PageRequest.of(0, 10))
                .stream().map(log -> {
                    Object parsedPayload = null;
                    try {
                        parsedPayload = objectMapper.readValue(log.getPayload(), Object.class);
                    } catch (Exception e) {}
                    
                    return IssueActivityLogResponse.builder()
                        .id(log.getId())
                        .userId(log.getUser().getId())
                        .userFullName(log.getUser().getFullName())
                        .userAvatarUrl(log.getUser().getAvatarUrl())
                        .issueId(log.getIssue().getId())
                        .issueKey(log.getIssue().getIssueKey())
                        .issueSummary(log.getIssue().getSummary())
                        .projectId(log.getIssue().getProject().getId())
                        .projectName(log.getIssue().getProject().getName())
                        .actionType(log.getActionType())
                        .payload(parsedPayload)
                        .createdAt(log.getCreatedAt())
                        .build();
                })
                .collect(Collectors.toList()));
    }
 
    @GetMapping("/activity-logs/issue/{issueId}")
    public ResponseEntity<List<IssueActivityLogResponse>> getActivityLogs(@PathVariable Long issueId) {
        return ResponseEntity.ok(issueActivityLogRepository.findByIssueIdOrderByCreatedAtDesc(issueId)
                .stream().map(log -> {
                    Object parsedPayload = null;
                    try {
                        parsedPayload = objectMapper.readValue(log.getPayload(), Object.class);
                    } catch (Exception e) {}
                    
                    return IssueActivityLogResponse.builder()
                        .id(log.getId())
                        .userId(log.getUser().getId())
                        .userFullName(log.getUser().getFullName())
                        .userAvatarUrl(log.getUser().getAvatarUrl())
                        .issueId(log.getIssue().getId())
                        .issueKey(log.getIssue().getIssueKey())
                        .issueSummary(log.getIssue().getSummary())
                        .actionType(log.getActionType())
                        .payload(parsedPayload)
                        .createdAt(log.getCreatedAt())
                        .build();
                })
                .collect(Collectors.toList()));
    }
}
