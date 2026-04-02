package com.jira.clone.services;

import com.jira.clone.models.dtos.issue.*;
import java.util.List;

public interface IssueService {
    IssueResponse createIssue(IssueCreateRequest request, Long reporterId);
    IssueResponse getIssueById(Long issueId);
    List<IssueResponse> getIssuesByProject(Long projectId);
    List<IssueResponse> getIssuesByBoardColumn(Long projectId, Long statusId);
    List<IssueResponse> getSubtasksByIssueId(Long issueId);
    List<IssueResponse> getIssuesByAssignee(Long userId);
    IssueResponse moveIssue(Long issueId, IssueMoveRequest request);
    IssueResponse updateIssue(Long issueId, IssueUpdateRequest request);
    IssueResponse updateIssueSprint(Long issueId, Long sprintId);
    void deleteIssue(Long issueId);
}
