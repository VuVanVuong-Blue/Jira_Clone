package com.jira.clone.models.entities;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;
import java.time.LocalDateTime;
import com.jira.clone.models.enums.AiToneOfVoice;

@Entity
@Table(name = "project_ai_configs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProjectAiConfig {

    @Id
    @Column(name = "project_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "project_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Project project;

    @Column(name = "is_ai_enabled")
    @Builder.Default
    private Boolean isAiEnabled = true;

    @Column(name = "project_context", columnDefinition = "TEXT")
    private String projectContext;

    @Enumerated(EnumType.STRING)
    @Column(name = "tone_of_voice", columnDefinition = "ENUM('professional', 'casual', 'technical') DEFAULT 'professional'")
    @Builder.Default
    private AiToneOfVoice toneOfVoice = AiToneOfVoice.professional;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
