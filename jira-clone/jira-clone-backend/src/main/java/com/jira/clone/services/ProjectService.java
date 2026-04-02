package com.jira.clone.services;

import com.jira.clone.models.dtos.project.*;
import java.util.List;

public interface ProjectService {
    ProjectResponse createProject(ProjectCreateRequest request, Long leadUserId);
    ProjectResponse getProjectById(Long projectId);
    List<ProjectResponse> getProjectsByUserId(Long userId);
    void deleteProject(Long projectId);
    ProjectMemberResponse addMember(Long projectId, ProjectMemberRequest request);
    List<ProjectMemberResponse> getMembers(Long projectId);
    void removeMember(Long projectId, Long userId);
    String getMyRoleInProject(Long projectId, Long userId);
    ProjectMemberResponse updateMemberRole(Long projectId, Long userId, Long roleId);
}
