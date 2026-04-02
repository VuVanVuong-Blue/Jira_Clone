package com.jira.clone.services;

import com.jira.clone.models.dtos.issue.IssueLinkCreateRequest;
import com.jira.clone.models.dtos.issue.IssueLinkResponse;
import java.util.List;

public interface IssueLinkService {
    List<IssueLinkResponse> getIssueLinksByProject(Long projectId);
    IssueLinkResponse createIssueLink(IssueLinkCreateRequest request);
    void deleteIssueLink(Long linkId);
}
