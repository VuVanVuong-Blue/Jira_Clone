package com.jira.clone.models.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import com.jira.clone.models.enums.AuthType;

@Entity
@Table(
    name = "user_auth_methods", 
    uniqueConstraints = {
        @UniqueConstraint(columnNames = {"auth_type", "identifier"})
    }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserAuthMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "auth_type", nullable = false)
    private AuthType authType;

    @Column(nullable = false)
    private String identifier;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "is_verified")
    @Builder.Default
    private Boolean isVerified = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
