package com.jira.clone.models.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;
import java.time.LocalDateTime;
import java.util.List;
import com.jira.clone.models.enums.IssueType;
import com.jira.clone.models.enums.IssuePriority;

@Entity
@Table(name = "issues")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@SQLDelete(sql = "UPDATE issues SET deleted_at = NOW() WHERE id = ? and version = ?")
@SQLRestriction("deleted_at IS NULL")
public class Issue {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "issue_key", nullable = false, unique = true, length = 20)
    private String issueKey;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "status_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Status status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_issue_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Issue parentIssue;

    @OneToMany(mappedBy = "parentIssue", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Issue> subtasks;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private IssueType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private IssuePriority priority = IssuePriority.medium;

    @Column(nullable = false)
    private String summary;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "board_position", nullable = false)
    private String boardPosition; // Vũ khí LexoRank kéo thả mượt mà

    @Version
    @Column(nullable = false)
    @Builder.Default
    private Integer version = 1; // Vũ khí Optimistic Locking chống ghi đè dữ liệu

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reporter_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assignee_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User assignee;

    @Column(name = "estimate_points")
    private Integer estimatePoints;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "issue_labels",
        joinColumns = @JoinColumn(name = "issue_id"),
        inverseJoinColumns = @JoinColumn(name = "label_id")
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Label> labels;

    // Bảng trung gian sprint_issues được map trực tiếp qua @JoinTable vì issue_id là khóa chính
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinTable(
        name = "sprint_issues",
        joinColumns = @JoinColumn(name = "issue_id", referencedColumnName = "id"),
        inverseJoinColumns = @JoinColumn(name = "sprint_id", referencedColumnName = "id")
    )
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Sprint sprint;
}
