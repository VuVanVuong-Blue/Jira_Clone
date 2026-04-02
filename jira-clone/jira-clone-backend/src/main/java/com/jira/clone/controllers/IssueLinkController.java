package com.jira.clone.controllers;

import com.jira.clone.models.dtos.issue.IssueLinkResponse;
import com.jira.clone.services.IssueLinkService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

import com.jira.clone.security.annotations.CheckProjectPermission;
import com.jira.clone.models.enums.Resource;
import com.jira.clone.models.enums.Action;

import com.jira.clone.models.dtos.issue.IssueLinkCreateRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/issue-links")
public class IssueLinkController {

    private final IssueLinkService issueLinkService;

    public IssueLinkController(IssueLinkService issueLinkService) {
        this.issueLinkService = issueLinkService;
    }

    @GetMapping("/project/{projectId}")
    @CheckProjectPermission(resource = Resource.ISSUE, action = Action.VIEW, projectIdParam = "projectId")
    public ResponseEntity<List<IssueLinkResponse>> getIssueLinksByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(issueLinkService.getIssueLinksByProject(projectId));
    }

    @PostMapping
    @CheckProjectPermission(resource = Resource.ISSUE, action = Action.EDIT, projectIdParam = "request")
    public ResponseEntity<IssueLinkResponse> createIssueLink(@Valid @RequestBody IssueLinkCreateRequest request) {
        return ResponseEntity.ok(issueLinkService.createIssueLink(request));
    }

    @DeleteMapping("/{linkId}")
    @CheckProjectPermission(resource = Resource.ISSUE, action = Action.EDIT, linkIdParam = "linkId")
    public ResponseEntity<?> deleteIssueLink(@PathVariable Long linkId) {
        issueLinkService.deleteIssueLink(linkId);
        return ResponseEntity.ok().build();
    }
}
