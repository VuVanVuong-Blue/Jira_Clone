package com.jira.clone.models.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Role {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column
    private String description;

    @Column(name = "is_system_default")
    @Builder.Default
    private Boolean isSystemDefault = false;

    @OneToMany(mappedBy = "role", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private java.util.List<RolePermission> permissions = new java.util.ArrayList<>();
}
