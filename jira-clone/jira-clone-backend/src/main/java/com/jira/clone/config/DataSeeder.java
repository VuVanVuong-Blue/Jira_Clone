package com.jira.clone.config;

import com.jira.clone.models.entities.Role;
import com.jira.clone.models.entities.RolePermission;
import com.jira.clone.models.entities.User;
import com.jira.clone.models.entities.UserAuthMethod;
import com.jira.clone.models.enums.Action;
import com.jira.clone.models.enums.AuthType;
import com.jira.clone.models.enums.GlobalRole;
import com.jira.clone.models.enums.Resource;
import com.jira.clone.repositories.RolePermissionRepository;
import com.jira.clone.repositories.RoleRepository;
import com.jira.clone.repositories.UserAuthMethodRepository;
import com.jira.clone.repositories.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.ArrayList;
import java.util.List;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner initData(
            RoleRepository roleRepository, 
            RolePermissionRepository rolePermissionRepository,
            UserRepository userRepository,
            UserAuthMethodRepository userAuthMethodRepository,
            PasswordEncoder passwordEncoder,
            JdbcTemplate jdbcTemplate) {
        return args -> {
            // Hotfix for database column constraints
            try {
                // Fix issue_id nullable
                jdbcTemplate.execute("ALTER TABLE notifications MODIFY COLUMN issue_id BIGINT NULL");
                // Fix type length/enum issues
                jdbcTemplate.execute("ALTER TABLE notifications MODIFY COLUMN type VARCHAR(50) NOT NULL");
                
                System.out.println(">>> SQL: Hotfixed notifications table (issue_id NULLABLE, type VARCHAR(50))");
            } catch (Exception e) {
                // If it fails, maybe it's already null or column name differs
                System.out.println(">>> SQL: Skipping notifications alter (maybe already updated)");
            }

            if (userRepository.count() == 0) {
                User adminUser = userRepository.save(User.builder()
                        .fullName("Hệ thống Jira")
                        .globalRole(GlobalRole.superadmin)
                        .build());

                userAuthMethodRepository.save(UserAuthMethod.builder()
                        .user(adminUser)
                        .authType(AuthType.email)
                        .identifier("admin@jira.com")
                        .passwordHash(passwordEncoder.encode("password123"))
                        .isVerified(true)
                        .build());
                
                System.out.println(">>> SEEDED DEFAULT USER: admin@jira.com / password123");
            }
            if (roleRepository.count() == 0) {
                // Create Admin
                Role admin = roleRepository.save(Role.builder()
                        .name("Admin")
                        .description("Toàn quyền hệ thống")
                        .isSystemDefault(true)
                        .build());
                
                List<RolePermission> adminPerms = new ArrayList<>();
                for (Resource r : Resource.values()) {
                    for (Action a : Action.values()) {
                        adminPerms.add(RolePermission.builder().role(admin).resource(r).action(a).build());
                    }
                }
                rolePermissionRepository.saveAll(adminPerms);

                // Create Project Manager
                Role pm = roleRepository.save(Role.builder()
                        .name("Project Manager")
                        .description("Quản lý dự án, issue và member")
                        .isSystemDefault(true)
                        .build());
                
                List<RolePermission> pmPerms = new ArrayList<>();
                for (Resource r : Resource.values()) {
                    for (Action a : Action.values()) {
                        if (r == Resource.SETTINGS && (a == Action.DELETE)) continue;
                        pmPerms.add(RolePermission.builder().role(pm).resource(r).action(a).build());
                    }
                }
                rolePermissionRepository.saveAll(pmPerms);

                // Create Developer
                Role dev = roleRepository.save(Role.builder()
                        .name("Developer")
                        .description("Thực hiện task, comment")
                        .isSystemDefault(true)
                        .build());
                
                List<RolePermission> devPerms = new ArrayList<>();
                for (Resource r : Resource.values()) {
                    if (r == Resource.ISSUE || r == Resource.COMMENT || r == Resource.SPRINT) {
                        devPerms.add(RolePermission.builder().role(dev).resource(r).action(Action.VIEW).build());
                        devPerms.add(RolePermission.builder().role(dev).resource(r).action(Action.CREATE).build());
                        devPerms.add(RolePermission.builder().role(dev).resource(r).action(Action.EDIT).build());
                    } else {
                        devPerms.add(RolePermission.builder().role(dev).resource(r).action(Action.VIEW).build());
                    }
                }
                rolePermissionRepository.saveAll(devPerms);

                // Create Viewer
                Role viewer = roleRepository.save(Role.builder()
                        .name("Viewer")
                        .description("Chỉ xem dự án")
                        .isSystemDefault(true)
                        .build());
                
                List<RolePermission> viewerPerms = new ArrayList<>();
                for (Resource r : Resource.values()) {
                    viewerPerms.add(RolePermission.builder().role(viewer).resource(r).action(Action.VIEW).build());
                }
                rolePermissionRepository.saveAll(viewerPerms);
            }
        };
    }
}
