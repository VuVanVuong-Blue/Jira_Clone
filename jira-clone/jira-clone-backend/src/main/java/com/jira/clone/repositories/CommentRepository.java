package com.jira.clone.repositories;

import com.jira.clone.models.entities.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    // Luôn lấy từ cũ đến mới cho Comment
    List<Comment> findByIssueIdOrderByCreatedAtAsc(Long issueId);
}
