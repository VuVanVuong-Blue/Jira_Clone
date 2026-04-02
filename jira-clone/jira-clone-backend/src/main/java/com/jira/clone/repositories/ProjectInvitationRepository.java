package com.jira.clone.repositories;

import com.jira.clone.models.entities.ProjectInvitation;
import com.jira.clone.models.enums.InvitationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ProjectInvitationRepository extends JpaRepository<ProjectInvitation, Long> {
    Optional<ProjectInvitation> findByProjectIdAndInviteeIdAndStatus(Long projectId, Long inviteeId, InvitationStatus status);
}
