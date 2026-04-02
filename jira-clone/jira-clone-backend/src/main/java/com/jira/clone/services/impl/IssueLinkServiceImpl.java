package com.jira.clone.services.impl;

import com.jira.clone.models.dtos.issue.IssueLinkCreateRequest;
import com.jira.clone.models.dtos.issue.IssueLinkResponse;
import com.jira.clone.models.entities.Issue;
import com.jira.clone.models.entities.IssueLink;
import com.jira.clone.repositories.IssueLinkRepository;
import com.jira.clone.repositories.IssueRepository;
import com.jira.clone.services.IssueLinkService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class IssueLinkServiceImpl implements IssueLinkService {

    private final IssueLinkRepository issueLinkRepository;
    private final IssueRepository issueRepository;

    public IssueLinkServiceImpl(IssueLinkRepository issueLinkRepository, IssueRepository issueRepository) {
        this.issueLinkRepository = issueLinkRepository;
        this.issueRepository = issueRepository;
    }

    @Override
    public List<IssueLinkResponse> getIssueLinksByProject(Long projectId) {
        return issueLinkRepository.findBySourceIssueProjectId(projectId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    @Transactional
    public IssueLinkResponse createIssueLink(IssueLinkCreateRequest request) {
        Issue src = issueRepository.findById(request.getSourceIssueId())
                .orElseThrow(() -> new RuntimeException("Source Issue không tồn tại."));
        Issue tgt = issueRepository.findById(request.getTargetIssueId())
                .orElseThrow(() -> new RuntimeException("Target Issue không tồn tại."));

        IssueLink link = IssueLink.builder()
                .sourceIssue(src)
                .targetIssue(tgt)
                .linkType(request.getLinkType())
                .build();
        
        link = issueLinkRepository.save(link);
        return toResponse(link);
    }

    @Override
    @Transactional
    public void deleteIssueLink(Long linkId) {
        issueLinkRepository.deleteById(linkId);
    }

    private IssueLinkResponse toResponse(IssueLink link) {
        return IssueLinkResponse.builder()
                .id(link.getId())
                .sourceIssueId(link.getSourceIssue().getId())
                .targetIssueId(link.getTargetIssue().getId())
                .linkType(link.getLinkType())
                .build();
    }
}
