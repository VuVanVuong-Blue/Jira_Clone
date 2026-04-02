package com.jira.clone.models.entities;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;
import com.jira.clone.models.enums.SprintStatus;

@Entity
@Table(name = "sprints")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sprint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Project project;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "end_date")
    private LocalDateTime endDate;

    @Enumerated(EnumType.STRING)
    @Column(columnDefinition = "ENUM('active', 'future', 'closed') DEFAULT 'future'")
    @Builder.Default
    private SprintStatus status = SprintStatus.future;

    @OneToMany(mappedBy = "sprint")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Issue> issues;
}
