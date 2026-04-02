package com.jira.clone.repositories;

import com.jira.clone.models.entities.ProjectMember;
import com.jira.clone.models.entities.ProjectMemberId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, ProjectMemberId> {
    
    // 1. Phục vụ màn hình Settings: truy xuất danh sách toàn bộ thành viên trong 1 project
    List<ProjectMember> findByProjectId(Long projectId);
    
    // 2. Phục vụ màn hình Dashboard (Your Work): Liệt kê mọi dự án mà user này đang tham gia
    List<ProjectMember> findByUserId(Long userId);

    @org.springframework.data.jpa.repository.Query("SELECT pm FROM ProjectMember pm " +
            "JOIN FETCH pm.role r " +
            "LEFT JOIN FETCH r.permissions " +
            "WHERE pm.project.id = :projectId AND pm.user.id = :userId")
    java.util.Optional<ProjectMember> findByProjectIdAndUserIdWithPermissions(Long projectId, Long userId);

    boolean existsByProjectIdAndUserId(Long projectId, Long userId);
}
