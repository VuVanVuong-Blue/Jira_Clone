package com.jira.clone.repositories;

import com.jira.clone.models.entities.AiUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiUsageLogRepository extends JpaRepository<AiUsageLog, Long> {
    
    // Tracking xem dự án nào đang "đốt" token nhiều quá
    List<AiUsageLog> findByProjectIdOrderByCreatedAtDesc(Long projectId);
}
