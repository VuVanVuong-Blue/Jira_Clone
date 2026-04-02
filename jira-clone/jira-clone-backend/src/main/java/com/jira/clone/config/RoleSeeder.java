package com.jira.clone.config;

import com.jira.clone.models.entities.Role;
import com.jira.clone.repositories.RoleRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

/**
 * Seed dữ liệu Role mặc định khi server khởi động.
 * Chỉ insert nếu Role chưa tồn tại trong DB (idempotent).
 */
@Component
public class RoleSeeder implements ApplicationRunner {

    private final RoleRepository roleRepository;

    public RoleSeeder(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(ApplicationArguments args) {
        seedRole("Admin",        "Quản trị viên dự án, toàn quyền");
        seedRole("Scrum Master", "Người điều phối Sprint và quy trình Agile");
        seedRole("Developer",    "Thành viên phát triển, có thể tạo/sửa Issue");
        seedRole("Viewer",       "Chỉ xem, không được thay đổi dữ liệu");
    }

    private void seedRole(String name, String description) {
        if (roleRepository.findByName(name).isEmpty()) {
            roleRepository.save(Role.builder()
                    .name(name)
                    .description(description)
                    .isSystemDefault(true)
                    .build());
            System.out.println("[RoleSeeder] Đã tạo Role: " + name);
        }
    }
}
