package com.jira.clone.models.dtos;

import com.jira.clone.models.enums.Action;
import com.jira.clone.models.enums.Resource;
import lombok.Data;

import java.util.List;

@Data
public class RoleRequest {
    private String name;
    private String description;
    private List<PermissionRequest> permissions;

    @Data
    public static class PermissionRequest {
        private Resource resource;
        private Action action;
    }
}
