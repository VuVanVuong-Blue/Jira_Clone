package com.jira.clone.repositories;

import com.jira.clone.models.entities.Sprint;
import com.jira.clone.models.enums.SprintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SprintRepository extends JpaRepository<Sprint, Long> {
    List<Sprint> findByProjectId(Long projectId);
    
    // Tìm Sprint đang chạy (active) hoặc tương lai (future)
    List<Sprint> findByProjectIdAndStatus(Long projectId, SprintStatus status);
}
