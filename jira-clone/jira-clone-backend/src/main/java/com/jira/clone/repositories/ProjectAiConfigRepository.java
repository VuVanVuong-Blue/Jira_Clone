package com.jira.clone.repositories;

import com.jira.clone.models.entities.ProjectAiConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectAiConfigRepository extends JpaRepository<ProjectAiConfig, Long> {
    // Không cần hàm Custom vì nó xài ID của Project (OneToOne)
}
