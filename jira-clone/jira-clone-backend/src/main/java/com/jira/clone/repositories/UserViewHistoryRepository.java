package com.jira.clone.repositories;

import com.jira.clone.models.entities.UserViewHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserViewHistoryRepository extends JpaRepository<UserViewHistory, Long> {
    
    // Lấy danh sách lịch sử truy cập (Recently Viewed) sắp xếp theo thời gian xem mới nhất
    List<UserViewHistory> findByUserIdOrderByViewedAtDesc(Long userId);
    
    // Tìm record lịch sử cụ thể để Update Timestamp khi họ xem lại
    Optional<UserViewHistory> findByUserIdAndIssueId(Long userId, Long issueId);
}
