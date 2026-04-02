package com.jira.clone.controllers;

import com.jira.clone.models.dtos.project.*;
import com.jira.clone.services.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

import com.jira.clone.security.annotations.CheckProjectPermission;
import com.jira.clone.models.enums.Resource;
import com.jira.clone.models.enums.Action;
//Controller xử lý các API liên quan đến project
@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }
    //API tạo project
    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody ProjectCreateRequest request,
            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(projectService.createProject(request, userId));
    }

    //API lấy thông tin project
    @GetMapping("/{projectId}")
    @CheckProjectPermission(resource = Resource.PROJECT, action = Action.VIEW, projectIdParam = "projectId")
    public ResponseEntity<ProjectResponse> getProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectService.getProjectById(projectId));
    }

    //API lấy danh sách project của tôi
    @GetMapping("/my")
    public ResponseEntity<List<ProjectResponse>> getMyProjects(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(projectService.getProjectsByUserId(userId));
    }

    //API xóa project
    @DeleteMapping("/{projectId}")
    @CheckProjectPermission(resource = Resource.PROJECT, action = Action.DELETE, projectIdParam = "projectId")
    public ResponseEntity<?> deleteProject(@PathVariable Long projectId) {
        projectService.deleteProject(projectId);
        return ResponseEntity.ok(Map.of("message", "Đã xóa project thành công."));
    }
    
    //API thêm thành viên vào project
    @PostMapping("/{projectId}/members")
    @CheckProjectPermission(resource = Resource.MEMBER, action = Action.CREATE, projectIdParam = "projectId")
    public ResponseEntity<ProjectMemberResponse> addMember(
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectMemberRequest request) {
        return ResponseEntity.ok(projectService.addMember(projectId, request));
    }

    //API lấy danh sách thành viên trong project
    @GetMapping("/{projectId}/members")
    @CheckProjectPermission(resource = Resource.MEMBER, action = Action.VIEW, projectIdParam = "projectId")
    public ResponseEntity<List<ProjectMemberResponse>> getMembers(@PathVariable Long projectId) {
        return ResponseEntity.ok(projectService.getMembers(projectId));
    }

    //API xóa thành viên khỏi project
    @DeleteMapping("/{projectId}/members/{userId}")
    @CheckProjectPermission(resource = Resource.MEMBER, action = Action.DELETE, projectIdParam = "projectId")
    public ResponseEntity<?> removeMember(@PathVariable Long projectId, @PathVariable Long userId) {
        projectService.removeMember(projectId, userId);
        return ResponseEntity.ok(Map.of("message", "Đã xóa thành viên."));
    }

    /** Lấy vai trò của bản thân trong dự án */
    @GetMapping("/{projectId}/my-role")
    @CheckProjectPermission(resource = Resource.PROJECT, action = Action.VIEW, projectIdParam = "projectId")
    public ResponseEntity<Map<String, String>> getMyRole(
            @PathVariable Long projectId,
            Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        String role = projectService.getMyRoleInProject(projectId, userId);
        return ResponseEntity.ok(Map.of("role", role));
    }

    /** Cập nhật vai trò cho một thành viên */
    @PutMapping("/{projectId}/members/{userId}/role")
    @CheckProjectPermission(resource = Resource.MEMBER, action = Action.EDIT, projectIdParam = "projectId")
    public ResponseEntity<ProjectMemberResponse> updateMemberRole(
            @PathVariable Long projectId,
            @PathVariable Long userId,
            @RequestBody Map<String, Long> body) {
        Long roleId = body.get("roleId");
        return ResponseEntity.ok(projectService.updateMemberRole(projectId, userId, roleId));
    }
}
