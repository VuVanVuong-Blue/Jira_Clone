package com.jira.clone.models.entities;

import jakarta.persistence.*;
import lombok.*;
import com.jira.clone.models.enums.StatusCategory;

@Entity
@Table(name = "statuses", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"project_id", "name"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Status {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Project project;

    @Column(nullable = false, length = 50)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatusCategory category;

    @Column(name = "board_position", nullable = false)
    @Builder.Default
    private Integer boardPosition = 0;
}
