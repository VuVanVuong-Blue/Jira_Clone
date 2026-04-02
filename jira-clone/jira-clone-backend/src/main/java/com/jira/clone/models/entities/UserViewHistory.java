package com.jira.clone.models.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_view_history", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "project_id", "issue_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserViewHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issue_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Issue issue;

    @UpdateTimestamp
    @Column(name = "viewed_at")
    private LocalDateTime viewedAt;
}
