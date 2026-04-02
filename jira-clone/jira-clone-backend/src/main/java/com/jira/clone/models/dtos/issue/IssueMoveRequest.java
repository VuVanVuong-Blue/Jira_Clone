package com.jira.clone.models.dtos.issue;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IssueMoveRequest {

    // [PHỤ TRÁCH LÕI - PHONG]
    // LexoRank position (Tháo NotBlank tạm thời để frontend không bị crash 400 error)
    private String newBoardPosition;

    // Thay vì NotNull, để tuỳ chọn vì có thể chỉ cập nhật Sprint
    private Long newStatusId;

    // [PHỤ TRÁCH MỞ RỘNG - KIỆT]
    private Long newSprintId;

    private Boolean removeFromSprint = false;

    // Tháo NotNull để xài chung nếu Frontend chưa kịp gửi
    private Integer version;
}
