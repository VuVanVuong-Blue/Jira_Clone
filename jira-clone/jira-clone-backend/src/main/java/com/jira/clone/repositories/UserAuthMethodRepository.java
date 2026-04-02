package com.jira.clone.repositories;

import com.jira.clone.models.entities.UserAuthMethod;
import com.jira.clone.models.enums.AuthType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserAuthMethodRepository extends JpaRepository<UserAuthMethod, Long> {

    // Tìm kiếm phương thức đăng nhập để xác thực thông tin user
    Optional<UserAuthMethod> findByAuthTypeAndIdentifier(AuthType authType, String identifier);

    // Kiểm tra trùng lặp khi người dùng đăng ký mới
    boolean existsByAuthTypeAndIdentifier(AuthType authType, String identifier);
}
