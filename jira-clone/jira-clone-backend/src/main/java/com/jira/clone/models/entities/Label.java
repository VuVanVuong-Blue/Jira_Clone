package com.jira.clone.models.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "labels", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"project_id", "name"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Label {

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

    @Column(name = "color_hex", length = 7)
    @Builder.Default
    private String colorHex = "#0052CC";
}
