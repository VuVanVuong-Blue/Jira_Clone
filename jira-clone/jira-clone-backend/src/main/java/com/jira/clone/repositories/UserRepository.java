package com.jira.clone.repositories;

import com.jira.clone.models.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    // Các lệnh custom query có thể mở rộng sau.
    // Việc tìm User qua Email hay Số điện thoại thường được Join với bảng UserAuthMethod.
    java.util.List<User> findByFullNameContainingIgnoreCase(String query);
}
