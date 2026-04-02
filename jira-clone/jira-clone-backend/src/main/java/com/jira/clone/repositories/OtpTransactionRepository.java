package com.jira.clone.repositories;

import com.jira.clone.models.entities.OtpTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpTransactionRepository extends JpaRepository<OtpTransaction, Long> {

    // Truy xuất mã OTP mới nhất tương ứng với số điện thoại/email chưa hết hạn
    Optional<OtpTransaction> findTopByTargetIdentifierOrderByCreatedAtDesc(String targetIdentifier);
}
