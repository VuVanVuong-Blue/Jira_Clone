package com.jira.clone.models.dtos.issue;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import java.util.List;

@Data
public class StatusReorderRequest {

    @NotNull
    private List<StatusPositionItem> positions;

    @Data
    public static class StatusPositionItem {
        @NotNull
        private Long statusId;

        @NotNull
        private Integer boardPosition;
    }
}
