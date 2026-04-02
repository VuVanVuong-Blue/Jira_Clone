package com.jira.clone.services.impl;

import com.jira.clone.models.dtos.project.*;
import com.jira.clone.models.entities.*;
import com.jira.clone.models.enums.StatusCategory;
import com.jira.clone.repositories.*;
import com.jira.clone.services.ProjectService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final StatusRepository statusRepository;

    public ProjectServiceImpl(ProjectRepository projectRepository,
                              UserRepository userRepository,
                              RoleRepository roleRepository,
                              ProjectMemberRepository projectMemberRepository,
                              StatusRepository statusRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.statusRepository = statusRepository;
    }

    @Override
    @Transactional
    public ProjectResponse createProject(ProjectCreateRequest request, Long leadUserId) {
        User lead = userRepository.findById(leadUserId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại."));

        Project project = Project.builder()
                .name(request.getName())
                .keyPrefix(request.getKeyPrefix().toUpperCase())
                .templateType(request.getTemplateType())
                .leadUser(lead)
                .build();
        project = projectRepository.save(project);

        // Tự động tạo 3 cột trạng thái mặc định cho Board
        statusRepository.save(Status.builder()
                .project(project).name("TODO").category(StatusCategory.todo).boardPosition(0).build());
        statusRepository.save(Status.builder()
                .project(project).name("IN PROGRESS").category(StatusCategory.in_progress).boardPosition(1).build());
        statusRepository.save(Status.builder()
                .project(project).name("DONE").category(StatusCategory.done).boardPosition(2).build());

        // Tự động thêm Lead vào project_members với role mặc định
        Role adminRole = roleRepository.findByName("Admin")
                .orElseGet(() -> roleRepository.save(Role.builder()
                        .name("Admin").description("Project Administrator").isSystemDefault(true).build()));

        ProjectMemberId memberId = new ProjectMemberId(project.getId(), leadUserId);
        projectMemberRepository.save(ProjectMember.builder()
                .id(memberId).project(project).user(lead).role(adminRole).build());

        return toResponse(project);
    }

    @Override
    public ProjectResponse getProjectById(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project không tồn tại."));
        return toResponse(project);
    }

    @Override
    public List<ProjectResponse> getProjectsByUserId(Long userId) {
        return projectMemberRepository.findByUserId(userId).stream()
                .map(pm -> toResponse(pm.getProject()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project không tồn tại."));
        
        // Cập nhật keyPrefix để giải phóng mã cho dự án mới (vì keyPrefix là UNIQUE)
        // Ví dụ: HET -> HET_DEL_162521
        String deletedPrefix = project.getKeyPrefix() + "_DEL_" + System.currentTimeMillis() % 100000;
        project.setKeyPrefix(deletedPrefix);
        projectRepository.save(project);

        projectRepository.delete(project); // Soft delete qua @SQLDelete
    }

    @Override
    @Transactional
    public ProjectMemberResponse addMember(Long projectId, ProjectMemberRequest request) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project không tồn tại."));
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new RuntimeException("User không tồn tại."));
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new RuntimeException("Role không tồn tại."));

        ProjectMemberId memberId = new ProjectMemberId(projectId, request.getUserId());
        ProjectMember member = ProjectMember.builder()
                .id(memberId).project(project).user(user).role(role).build();
        projectMemberRepository.save(member);

        return ProjectMemberResponse.builder()
                .userId(user.getId()).fullName(user.getFullName())
                .avatarUrl(user.getAvatarUrl())
                .roleId(role.getId()).roleName(role.getName())
                .build();
    }

    @Override
    public List<ProjectMemberResponse> getMembers(Long projectId) {
        return projectMemberRepository.findByProjectId(projectId).stream()
                .map(pm -> ProjectMemberResponse.builder()
                        .userId(pm.getUser().getId())
                        .fullName(pm.getUser().getFullName())
                        .avatarUrl(pm.getUser().getAvatarUrl())
                        .roleId(pm.getRole().getId())
                        .roleName(pm.getRole().getName())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void removeMember(Long projectId, Long userId) {
        ProjectMemberId memberId = new ProjectMemberId(projectId, userId);
        projectMemberRepository.deleteById(memberId);
    }

    @Override
    public String getMyRoleInProject(Long projectId, Long userId) {
        ProjectMemberId memberId = new ProjectMemberId(projectId, userId);
        return projectMemberRepository.findById(memberId)
                .map(pm -> pm.getRole().getName())
                .orElse("Viewer");
    }

    @Override
    @Transactional
    public ProjectMemberResponse updateMemberRole(Long projectId, Long userId, Long roleId) {
        ProjectMemberId memberId = new ProjectMemberId(projectId, userId);
        ProjectMember member = projectMemberRepository.findById(memberId)
                .orElseThrow(() -> new RuntimeException("Thành viên không tồn tại trong dự án."));
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role không tồn tại."));
        member.setRole(role);
        projectMemberRepository.save(member);
        return ProjectMemberResponse.builder()
                .userId(member.getUser().getId())
                .fullName(member.getUser().getFullName())
                .avatarUrl(member.getUser().getAvatarUrl())
                .roleId(role.getId()).roleName(role.getName())
                .build();
    }

    private ProjectResponse toResponse(Project p) {
        return ProjectResponse.builder()
                .id(p.getId()).name(p.getName()).keyPrefix(p.getKeyPrefix())
                .iconUrl(p.getIconUrl()).templateType(p.getTemplateType())
                .status(p.getStatus()).leadUserId(p.getLeadUser().getId())
                .build();
    }
}
