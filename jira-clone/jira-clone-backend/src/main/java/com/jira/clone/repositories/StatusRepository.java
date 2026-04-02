package com.jira.clone.repositories;

import com.jira.clone.models.entities.Status;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StatusRepository extends JpaRepository<Status, Long> {
    // Sắp xếp các cột Trạng thái theo đúng thứ tự thiết đặt
    List<Status> findByProjectIdOrderByBoardPositionAsc(Long projectId);
}
