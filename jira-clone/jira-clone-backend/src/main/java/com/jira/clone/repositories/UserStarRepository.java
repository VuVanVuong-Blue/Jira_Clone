package com.jira.clone.repositories;

import com.jira.clone.models.entities.UserStar;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserStarRepository extends JpaRepository<UserStar, Long> {
    
    // Lấy danh sách đánh dấu sao để show ra menu Your Work
    List<UserStar> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    boolean existsByUserIdAndProjectId(Long userId, Long projectId);
    boolean existsByUserIdAndIssueId(Long userId, Long issueId);
    
    java.util.Optional<UserStar> findByUserIdAndProjectId(Long userId, Long projectId);
    java.util.Optional<UserStar> findByUserIdAndIssueId(Long userId, Long issueId);
}
