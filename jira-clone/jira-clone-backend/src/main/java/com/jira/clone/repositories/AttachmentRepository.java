package com.jira.clone.repositories;

import com.jira.clone.models.entities.Attachment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AttachmentRepository extends JpaRepository<Attachment, Long> {
    // Ưu tiên hiển thị File mới tải lên đầu
    List<Attachment> findByIssueIdOrderByUploadedAtDesc(Long issueId);
}
