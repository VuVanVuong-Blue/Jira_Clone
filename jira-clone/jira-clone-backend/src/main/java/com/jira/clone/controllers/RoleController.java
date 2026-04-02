package com.jira.clone.controllers;

import com.jira.clone.models.dtos.RoleRequest;
import com.jira.clone.models.entities.Role;
import com.jira.clone.models.entities.RolePermission;
import com.jira.clone.repositories.RoleRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

import java.util.List;
//Controller xử lý các API liên quan đến role
@RestController
@RequestMapping("/api/roles")
public class RoleController {

    private final RoleRepository roleRepository;
   
    @PersistenceContext
    private EntityManager entityManager;

    public RoleController(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }
    //API lấy danh sách role
    @GetMapping
    public ResponseEntity<List<Role>> getAllRoles() {
        return ResponseEntity.ok(roleRepository.findAll());
    }
    //API tạo role
    @PostMapping
    @Transactional
    public ResponseEntity<Role> createRole(@RequestBody RoleRequest request) {
        if (roleRepository.existsByName(request.getName())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }

        Role role = Role.builder()
                .name(request.getName())
                .description(request.getDescription())
                .isSystemDefault(false)
                .build();

        final Role savedRole = roleRepository.save(role);

        if (request.getPermissions() != null) {
            request.getPermissions().forEach(p -> {
                savedRole.getPermissions().add(RolePermission.builder()
                        .role(savedRole)
                        .resource(p.getResource())
                        .action(p.getAction())
                        .build());
            });
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(savedRole);
    }

    //API cập nhật role
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<Role> updateRole(@PathVariable Long id, @RequestBody RoleRequest request) {
        return roleRepository.findById(id).map(role -> {
            if (role.getIsSystemDefault()) {
                // For system roles, maybe we only allow updating permissions, not name
                role.setDescription(request.getDescription());
            } else {
                role.setName(request.getName());
                role.setDescription(request.getDescription());
            }

            // Sync permissions
            role.getPermissions().clear();
            // Bắt buộc flush để Hibernate thực hiện lệnh DELETE các bản ghi cũ 
            // trước khi INSERT các bản ghi mới, tránh lỗi trùng Unique Constraint.
            entityManager.flush();
            
            if (request.getPermissions() != null) {
                request.getPermissions().forEach(p -> {
                    role.getPermissions().add(RolePermission.builder()
                            .role(role)
                            .resource(p.getResource())
                            .action(p.getAction())
                            .build());
                });
            }

            return ResponseEntity.ok(roleRepository.save(role));
        }).orElse(ResponseEntity.notFound().build());
    }
    //API xóa role
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRole(@PathVariable Long id) {
        return roleRepository.findById(id).map(role -> {
            if (role.getIsSystemDefault()) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).<Void>build();
            }
            roleRepository.delete(role);
            return ResponseEntity.ok().<Void>build();
        }).orElse(ResponseEntity.notFound().build());
    }
}
