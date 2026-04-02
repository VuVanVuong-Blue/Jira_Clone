package com.jira.clone.controllers;

import com.jira.clone.models.dtos.collaboration.InvitationRequest;
import com.jira.clone.models.entities.ProjectInvitation;
import com.jira.clone.services.InvitationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/invitations")
public class InvitationController {

    private final InvitationService invitationService;

    public InvitationController(InvitationService invitationService) {
        this.invitationService = invitationService;
    }

    @PostMapping("/project/{projectId}")
    public ResponseEntity<ProjectInvitation> invite(
            @PathVariable Long projectId,
            @RequestBody InvitationRequest request,
            Authentication auth) {
        Long inviterId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(invitationService.inviteUser(
                projectId, inviterId, request.getRecipientId(), request.getRoleId()));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<Void> accept(@PathVariable Long id, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        invitationService.acceptInvitation(id, userId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<Void> reject(@PathVariable Long id, Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        invitationService.rejectInvitation(id, userId);
        return ResponseEntity.ok().build();
    }
}
