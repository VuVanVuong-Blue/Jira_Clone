package com.jira.clone.services;

import com.jira.clone.models.entities.*;
import com.jira.clone.models.enums.InvitationStatus;
import com.jira.clone.repositories.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
public class InvitationService {

    private final ProjectInvitationRepository invitationRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public InvitationService(ProjectInvitationRepository invitationRepository,
                                ProjectMemberRepository projectMemberRepository,
                                ProjectRepository projectRepository,
                                UserRepository userRepository,
                                RoleRepository roleRepository,
                                NotificationService notificationService,
                                EmailService emailService) {
        this.invitationRepository = invitationRepository;
        this.projectMemberRepository = projectMemberRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.notificationService = notificationService;
        this.emailService = emailService;
    }

    @Transactional
    public ProjectInvitation inviteUser(Long projectId, Long inviterId, Long inviteeId, Long roleId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));
        User inviter = userRepository.findById(inviterId)
                .orElseThrow(() -> new RuntimeException("Inviter not found"));
        User invitee = userRepository.findById(inviteeId)
                .orElseThrow(() -> new RuntimeException("Invitee not found"));
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found"));

        // Check if already a member
        if (projectMemberRepository.existsByProjectIdAndUserId(projectId, inviteeId)) {
            throw new RuntimeException("User is already a member of this project");
        }

        // Check if there's already a pending invitation
        Optional<ProjectInvitation> existing = invitationRepository.findByProjectIdAndInviteeIdAndStatus(projectId, inviteeId, InvitationStatus.PENDING);
        if (existing.isPresent()) {
            return existing.get();
        }

        ProjectInvitation invitation = ProjectInvitation.builder()
                .project(project)
                .inviter(inviter)
                .invitee(invitee)
                .role(role)
                .status(InvitationStatus.PENDING)
                .build();

        ProjectInvitation saved = invitationRepository.save(invitation);
        
        // Notify the invitee (In-app)
        notificationService.createInvitationNotification(invitee, inviter, saved);

        // Notify the invitee (Email)
        try {
            emailService.sendInvitationEmail(invitee.getEmail(), inviter.getFullName(), project.getName());
        } catch (Exception e) {
            System.err.println("❌ ERROR: Gửi email mời thất bại");
        }

        return saved;
    }

    @Transactional
    public void acceptInvitation(Long invitationId, Long userId) {
        ProjectInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        if (!invitation.getInvitee().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to accept this invitation");
        }

        // If already accepted, just return silently
        if (invitation.getStatus() == InvitationStatus.ACCEPTED) {
             notificationService.removeInvitationNotifications(invitationId);
             return;
        }

        if (invitation.getStatus() != InvitationStatus.PENDING) {
             notificationService.removeInvitationNotifications(invitationId);
             return; // Or throw custom exception. Silencing for better UX as requested.
        }

        invitation.setStatus(InvitationStatus.ACCEPTED);
        invitationRepository.save(invitation);

        // Xóa thông báo liên quan
        notificationService.removeInvitationNotifications(invitationId);

        // Add to project members
        ProjectMember member = ProjectMember.builder()
                .id(new ProjectMemberId(invitation.getProject().getId(), userId))
                .project(invitation.getProject())
                .user(invitation.getInvitee())
                .role(invitation.getRole())
                .build();
        
        projectMemberRepository.save(member);
    }

    @Transactional
    public void rejectInvitation(Long invitationId, Long userId) {
        ProjectInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(() -> new RuntimeException("Invitation not found"));

        if (!invitation.getInvitee().getId().equals(userId)) {
            throw new RuntimeException("You are not authorized to reject this invitation");
        }
        
        if (invitation.getStatus() == InvitationStatus.REJECTED || invitation.getStatus() == InvitationStatus.ACCEPTED) {
            notificationService.removeInvitationNotifications(invitationId);
            return;
        }

        invitation.setStatus(InvitationStatus.REJECTED);
        invitationRepository.save(invitation);
        
        // Xóa thông báo liên quan
        notificationService.removeInvitationNotifications(invitationId);
    }
}
