package com.jira.clone.controllers;

import com.jira.clone.models.dtos.issue.*;
import com.jira.clone.services.IssueService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.jira.clone.models.enums.Action;
import com.jira.clone.models.enums.Resource;
import com.jira.clone.security.annotations.CheckProjectPermission;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/issues")
public class IssueController {

    private final IssueService issueService;

    public IssueController(IssueService issueService) {
        this.issueService = issueService;
    }
    //API tạo issue
    @PostMapping
    @CheckProjectPermission(resource = Resource.ISSUE, action = Action.CREATE, projectIdParam = "request")
    public ResponseEntity<IssueResponse> createIssue(
            @Valid @RequestBody IssueCreateRequest request,
            Authentication auth) {
        Long reporterId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(issueService.createIssue(request, reporterId));
    }

    //API lấy thông tin issue
    @GetMapping("/{issueId}")
    public ResponseEntity<IssueResponse> getIssue(@PathVariable Long issueId) {
        return ResponseEntity.ok(issueService.getIssueById(issueId));
    }
    //API lấy danh sách issue theo project
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<IssueResponse>> getIssuesByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(issueService.getIssuesByProject(projectId));
    }

    //API lấy danh sách issue theo board column
    @GetMapping("/board/{projectId}/{statusId}")
    public ResponseEntity<List<IssueResponse>> getBoardColumn(
            @PathVariable Long projectId, @PathVariable Long statusId) {
        return ResponseEntity.ok(issueService.getIssuesByBoardColumn(projectId, statusId));
    }
    //API lấy danh sách issue của tôi
    @GetMapping("/my")
    public ResponseEntity<List<IssueResponse>> getMyIssues(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(issueService.getIssuesByAssignee(userId));
    }
    //API lấy danh sách issue con
    @GetMapping("/{issueId}/subtasks")
    public ResponseEntity<List<IssueResponse>> getSubtasks(@PathVariable Long issueId) {
        return ResponseEntity.ok(issueService.getSubtasksByIssueId(issueId));
    }

    /** Kéo thả Issue trên Board Kanban (LexoRank + Optimistic Locking) */
    @PutMapping("/{issueId}/move")
    @CheckProjectPermission(resource = Resource.ISSUE, action = Action.EDIT, issueIdParam = "issueId")
    public ResponseEntity<IssueResponse> moveIssue(
            @PathVariable Long issueId,
            @Valid @RequestBody IssueMoveRequest request) {
        return ResponseEntity.ok(issueService.moveIssue(issueId, request));
    }

    @PutMapping("/{issueId}")
    @CheckProjectPermission(resource = Resource.ISSUE, action = Action.EDIT, issueIdParam = "issueId")
    public ResponseEntity<IssueResponse> updateIssue(
            @PathVariable Long issueId,
            @Valid @RequestBody IssueUpdateRequest request) {
        return ResponseEntity.ok(issueService.updateIssue(issueId, request));
    }

    @PutMapping("/{issueId}/sprint")
    public ResponseEntity<IssueResponse> updateIssueSprint(
            @PathVariable Long issueId,
            @RequestBody IssueSprintUpdateRequest request) {
        return ResponseEntity.ok(issueService.updateIssueSprint(issueId, request.getSprintId()));
    }

    @DeleteMapping("/{issueId}")
    @CheckProjectPermission(resource = Resource.ISSUE, action = Action.DELETE, issueIdParam = "issueId")
    public ResponseEntity<?> deleteIssue(@PathVariable Long issueId) {
        issueService.deleteIssue(issueId);
        return ResponseEntity.ok(Map.of("message", "Đã xóa issue."));
    }
}
