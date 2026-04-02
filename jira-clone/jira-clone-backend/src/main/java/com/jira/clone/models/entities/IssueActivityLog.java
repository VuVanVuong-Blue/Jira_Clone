package com.jira.clone.models.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "issue_activity_logs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueActivityLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id; // BIGINT mapping 

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Issue issue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;

    @Column(name = "action_type", nullable = false, length = 50)
    private String actionType;

    // MySQL 5.5.5 workaround: Use String instead of Map to avoid Hibernate cast errors
    @Column(name = "payload", columnDefinition = "LONGTEXT", nullable = false)
    private String payload;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
