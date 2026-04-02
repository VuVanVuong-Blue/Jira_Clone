package com.jira.clone.repositories;

import com.jira.clone.models.entities.Role;
import com.jira.clone.models.entities.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, Long> {
    List<RolePermission> findAllByRole(Role role);
    void deleteAllByRole(Role role);
}
