package com.jira.clone.models.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import java.time.LocalDateTime;
import java.util.List;
import com.jira.clone.models.enums.GlobalRole;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLDelete(sql = "UPDATE users SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Lob
    @Column(name = "profile_avatar_url", columnDefinition = "LONGTEXT")
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "global_role", nullable = false)
    @Builder.Default
    private GlobalRole globalRole = GlobalRole.user;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    // Relationship to UserAuthMethod
    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<UserAuthMethod> authMethods;

    public String getEmail() {
        if (authMethods == null || authMethods.isEmpty()) return null;
        return authMethods.stream()
                .filter(m -> com.jira.clone.models.enums.AuthType.email.equals(m.getAuthType()) || com.jira.clone.models.enums.AuthType.google.equals(m.getAuthType()))
                .map(UserAuthMethod::getIdentifier)
                .findFirst()
                .orElse(authMethods.get(0).getIdentifier());
    }
}
