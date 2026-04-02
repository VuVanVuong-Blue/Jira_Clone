package com.jira.clone.repositories;

import com.jira.clone.models.entities.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // Lấy chuông thông báo mới nhất
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(Long recipientId);
    
    // Đếm số lượng thông báo chưa đọc (hiện chấm đỏ trên UI)
    long countByRecipientIdAndIsReadFalse(Long recipientId);
}
