package com.jira.clone.controllers;

import com.jira.clone.models.dtos.collaboration.NotificationResponse;
import com.jira.clone.models.entities.Notification;
import com.jira.clone.services.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

//Controller xử lý các API liên quan đến thông báo
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    //API lấy danh sách thông báo
    @GetMapping
    public ResponseEntity<List<NotificationResponse>> getNotifications(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        List<Notification> list = notificationService.getNotificationsForUser(userId);
        return ResponseEntity.ok(list.stream().map(n -> {
                var actor = n.getActor(); // null khi hệ thống tự gửi (deadline_reminder)
                return NotificationResponse.builder()
                        .id(n.getId())
                        .actorId(actor != null ? actor.getId() : null)
                        .actorName(actor != null ? actor.getFullName() : null)
                        .actorAvatarUrl(actor != null ? actor.getAvatarUrl() : null)
                        .issueId(n.getIssue() != null ? n.getIssue().getId() : null)
                        .issueKey(n.getIssue() != null ? n.getIssue().getIssueKey() : null)
                        .issueSummary(n.getIssue() != null ? n.getIssue().getSummary() : null)
                        .type(n.getType())
                        .isRead(n.getIsRead())
                        .createdAt(n.getCreatedAt())
                        // Project invitation info
                        .projectName(n.getProjectInvitation() != null ? n.getProjectInvitation().getProject().getName() : null)
                        .invitationId(n.getProjectInvitation() != null ? n.getProjectInvitation().getId() : null)
                        .invitationStatus(n.getProjectInvitation() != null ? n.getProjectInvitation().getStatus().name() : null)
                        .build();
        }).collect(Collectors.toList()));
    }

    //API lấy số lượng thông báo chưa đọc
    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        return ResponseEntity.ok(notificationService.countUnread(userId));
    }

    //API đánh dấu thông báo đã đọc
    @PutMapping("/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        notificationService.markAsRead(id);
        return ResponseEntity.ok().build();
    }

    //API đánh dấu tất cả thông báo đã đọc
    @PutMapping("/mark-all-read")
    public ResponseEntity<Void> markAllRead(Authentication auth) {
        Long userId = (Long) auth.getPrincipal();
        notificationService.markAllAsRead(userId);
        return ResponseEntity.ok().build();
    }

    //API xóa một thông báo cụ thể
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable("id") Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.ok().build();
    }
}
