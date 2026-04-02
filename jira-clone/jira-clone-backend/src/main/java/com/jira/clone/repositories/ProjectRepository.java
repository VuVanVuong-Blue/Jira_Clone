package com.jira.clone.repositories;

import com.jira.clone.models.entities.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    
    // Lấy dự án dễ dàng thông qua tiền tố Jira Key duy nhất (ví dụ: T5, TAT)
    Optional<Project> findByKeyPrefix(String keyPrefix);
    
    // Liệt kê mọi dự án mà một Lead quản lý 
    List<Project> findByLeadUserId(Long leadUserId);
}
