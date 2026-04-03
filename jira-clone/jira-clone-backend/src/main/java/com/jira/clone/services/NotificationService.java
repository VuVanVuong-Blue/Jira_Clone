package com.jira.clone.services;

import com.jira.clone.models.entities.*;
import com.jira.clone.models.enums.NotificationType;
import com.jira.clone.repositories.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;

    public NotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void createIssueNotification(User recipient, User actor, Issue issue, NotificationType type) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .issue(issue)
                .type(type)
                .build();
        notificationRepository.save(notification);
    }

    @Transactional
    public void createInvitationNotification(User recipient, User actor, ProjectInvitation invitation) {
        Notification notification = Notification.builder()
                .recipient(recipient)
                .actor(actor)
                .projectInvitation(invitation)
                .type(NotificationType.project_invitation)
                .build();
        notificationRepository.save(notification);
    }

    public List<Notification> getNotificationsForUser(Long userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    public long countUnread(Long userId) {
        return notificationRepository.countByRecipientIdAndIsReadFalse(userId);
    }

    @Transactional
    public void markAsRead(Long notificationId) {
        notificationRepository.findById(notificationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
        unread.forEach(n -> n.setIsRead(true));
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public void markInvitationNotificationRead(Long invitationId) {
        notificationRepository.findByProjectInvitationId(invitationId).ifPresent(n -> {
            n.setIsRead(true);
            notificationRepository.save(n);
        });
    }

    @Transactional
    public void removeInvitationNotifications(Long invitationId) {
        notificationRepository.deleteByProjectInvitationId(invitationId);
    }

    @Transactional
    public void deleteNotification(Long id) {
        notificationRepository.deleteById(id);
    }
}
