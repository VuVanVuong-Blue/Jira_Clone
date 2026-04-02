package com.jira.clone.repositories;

import com.jira.clone.models.entities.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Long> {
    
    // Lấy quyền theo tên (vd: 'Scrum Master', 'Developer')
    Optional<Role> findByName(String name);

    boolean existsByName(String name);
}
