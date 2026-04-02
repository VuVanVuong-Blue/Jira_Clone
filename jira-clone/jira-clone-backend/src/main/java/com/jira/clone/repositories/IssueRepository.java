package com.jira.clone.repositories;

import com.jira.clone.models.entities.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IssueRepository extends JpaRepository<Issue, Long> {
    Optional<Issue> findByIssueKey(String issueKey);
    List<Issue> findByProjectId(Long projectId);
    
    @org.springframework.data.jpa.repository.Query(value = "SELECT COUNT(*) FROM issues WHERE project_id = ?", nativeQuery = true)
    long countAllByProjectId(Long projectId);
    
    List<Issue> findByAssigneeId(Long assigneeId);
    List<Issue> findBySprintId(Long sprintId);
    
    // Lấy danh sách Issue cho 1 Cột trong Board và Sắp xếp hoàn hảo bằng thẻ LexoRank
    List<Issue> findByProjectIdAndStatusIdOrderByBoardPositionAsc(Long projectId, Long statusId);

    // Lấy danh sách subtasks cho một Issue con
    List<Issue> findByParentIssueId(Long parentIssueId);
}
