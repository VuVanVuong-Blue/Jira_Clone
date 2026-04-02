package com.jira.clone.models.dtos.collaboration;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class LabelResponse {
    private Long id;
    private String name;
    private String colorHex;
}
