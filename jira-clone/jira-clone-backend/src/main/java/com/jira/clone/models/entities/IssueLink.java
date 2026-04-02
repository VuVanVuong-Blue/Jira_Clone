package com.jira.clone.models.entities;

import jakarta.persistence.*;
import lombok.*;
import com.jira.clone.models.enums.IssueLinkType;

@Entity
@Table(name = "issue_links")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IssueLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "source_issue_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Issue sourceIssue;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_issue_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Issue targetIssue;

    @Enumerated(EnumType.STRING)
    @Column(name = "link_type", nullable = false)
    private IssueLinkType linkType;
}
