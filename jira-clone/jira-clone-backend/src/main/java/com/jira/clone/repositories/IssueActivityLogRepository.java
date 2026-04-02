package com.jira.clone.repositories;

import com.jira.clone.models.entities.IssueActivityLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IssueActivityLogRepository extends JpaRepository<IssueActivityLog, Long> {
    
    // Render lịch sử Activity của 1 Task (từ mới đến cũ)
    List<IssueActivityLog> findByIssueIdOrderByCreatedAtDesc(Long issueId);

    // Lấy hoạt động toàn cục của User (cho Dashboard)
    List<IssueActivityLog> findByUserIdOrderByCreatedAtDesc(Long userId, org.springframework.data.domain.Pageable pageable);
}
