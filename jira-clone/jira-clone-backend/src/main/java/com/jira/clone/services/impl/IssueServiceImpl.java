package com.jira.clone.services.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jira.clone.models.dtos.issue.*;
import com.jira.clone.models.entities.*;
import com.jira.clone.models.enums.IssuePriority;
import com.jira.clone.repositories.*;
import com.jira.clone.services.IssueService;
import java.util.Map;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class IssueServiceImpl implements IssueService {

    private final IssueRepository issueRepository;
    private final ProjectRepository projectRepository;
    private final StatusRepository statusRepository;
    private final UserRepository userRepository;
    private final SprintRepository sprintRepository;
    private final IssueActivityLogRepository activityLogRepository;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    // Counter đơn giản cho issue key (production nên dùng sequence DB)
    public IssueServiceImpl(IssueRepository issueRepository,
                            ProjectRepository projectRepository,
                            StatusRepository statusRepository,
                            UserRepository userRepository,
                            SprintRepository sprintRepository,
                            IssueActivityLogRepository activityLogRepository,
                            ObjectMapper objectMapper,
                            ApplicationEventPublisher eventPublisher) {
        this.issueRepository = issueRepository;
        this.projectRepository = projectRepository;
        this.statusRepository = statusRepository;
        this.userRepository = userRepository;
        this.sprintRepository = sprintRepository;
        this.activityLogRepository = activityLogRepository;
        this.objectMapper = objectMapper;
        this.eventPublisher = eventPublisher;
    }

    @Override
    @Transactional
    public IssueResponse createIssue(IssueCreateRequest request, Long reporterId) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project không tồn tại."));

        User reporter = userRepository.findById(reporterId)
                .orElseThrow(() -> new RuntimeException("User không tồn tại."));

        Status targetStatus;
        if (request.getStatusId() != null) {
            targetStatus = statusRepository.findById(request.getStatusId())
                    .orElseThrow(() -> new RuntimeException("Status không tồn tại."));
        } else {
            // Lấy cột mặc định nếu không ném statusId (Tạo nhanh không chỉ định góc)
            List<Status> statuses = statusRepository.findByProjectIdOrderByBoardPositionAsc(project.getId());
            targetStatus = statuses.stream().findFirst()
                    .orElseThrow(() -> new RuntimeException("Project chưa có trạng thái nào."));
        }

        // Sinh issue key: PREFIX-<count+1>
        long count = issueRepository.countAllByProjectId(project.getId());
        String issueKey = project.getKeyPrefix() + "-" + (count + 1);

        // LexoRank: Sinh vị trí cuối cùng đơn giản
        String boardPosition = "0|" + String.format("%06d", count + 1) + ":";

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId()).orElse(null);
        }

        Issue parentIssue = null;
        if (request.getParentIssueId() != null) {
            parentIssue = issueRepository.findById(request.getParentIssueId())
                    .orElseThrow(() -> new RuntimeException("Parent issue không tồn tại."));
            
            // Ngăn chặn lồng Sub-task (Chỉ cho phép: Task/Story -> Sub-task)
            if (parentIssue.getType() == com.jira.clone.models.enums.IssueType.subtask) {
                throw new RuntimeException("Không thể tạo Sub-task lồng bên trong một Sub-task khác.");
            }
        }

        Issue issue = Issue.builder()
                .issueKey(issueKey)
                .project(project)
                .status(targetStatus)
                .type(request.getType())
                .priority(request.getPriority() != null ? request.getPriority() : IssuePriority.medium)
                .summary(request.getSummary())
                .description(request.getDescription())
                .boardPosition(boardPosition)
                .reporter(reporter)
                .assignee(assignee)
                .parentIssue(parentIssue)
                .startDate(request.getStartDate())
                .dueDate(request.getDueDate())
                .build();
        issue = issueRepository.save(issue);
        
        // Log Activity
        try {
            activityLogRepository.save(IssueActivityLog.builder()
                    .issue(issue).user(reporter).actionType("CREATE_ISSUE")
                    .payload(objectMapper.writeValueAsString(Map.of("summary", issue.getSummary()))).build());
        } catch (Exception e) {}

        return toResponse(issue);
    }

    @Override
    public IssueResponse getIssueById(Long issueId) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue không tồn tại."));
        return toResponse(issue);
    }

    @Override
    public List<IssueResponse> getIssuesByProject(Long projectId) {
        return issueRepository.findByProjectId(projectId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<IssueResponse> getIssuesByBoardColumn(Long projectId, Long statusId) {
        return issueRepository
                .findByProjectIdAndStatusIdOrderByBoardPositionAsc(projectId, statusId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<IssueResponse> getSubtasksByIssueId(Long issueId) {
        return issueRepository.findByParentIssueId(issueId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    @Override
    public List<IssueResponse> getIssuesByAssignee(Long userId) {
        return issueRepository.findByAssigneeId(userId).stream()
                .map(this::toResponse).collect(Collectors.toList());
    }

    /**
     * Kéo thả Issue trên Board Kanban.
     * Sử dụng Optimistic Locking (@Version) để chống ghi đè khi 2 user kéo thả cùng lúc.
     */
    @Override
    @Transactional(rollbackFor = Exception.class)
    public IssueResponse moveIssue(Long issueId, IssueMoveRequest request) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue không tồn tại."));

        // Optimistic Locking check - chỉ kiểm tra nếu frontend gửi version
        if (request.getVersion() != null && issue.getVersion() != null 
                && !issue.getVersion().equals(request.getVersion())) {
            throw new RuntimeException("Xung đột dữ liệu! Issue đã bị chỉnh sửa bởi người khác. Vui lòng tải lại.");
        }

        String oldStatusName = issue.getStatus().getName();
        
        // 1. Cập nhật Status (nếu có)
        if (request.getNewStatusId() != null) {
            Status newStatus = statusRepository.findById(request.getNewStatusId())
                    .orElseThrow(() -> new RuntimeException("Status không tồn tại."));
            issue.setStatus(newStatus);
            
                // Log Activity (Status Change)
                try {
                    Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
                    User currentUser = userRepository.findById(userId).orElseThrow();
                    
                    java.util.Map<String, Object> payload = new java.util.HashMap<>();
                    payload.put("oldStatus", oldStatusName);
                    payload.put("newStatus", newStatus.getName());
                    
                    activityLogRepository.save(IssueActivityLog.builder()
                            .issue(issue)
                            .user(currentUser)
                            .actionType("UPDATE_STATUS")
                            .payload(objectMapper.writeValueAsString(payload))
                            .build());
                } catch (Exception e) {
                    // Background tasks or non-auth context
                    System.out.println(">>> Skip logging: " + e.getMessage());
                }
        }

        // 2. Cập nhật Sprint (nếu có - Kiệt)
        if (request.getNewSprintId() != null) {
            Sprint newSprint = sprintRepository.findById(request.getNewSprintId())
                    .orElseThrow(() -> new RuntimeException("Sprint không tồn tại."));
            issue.setSprint(newSprint);
        } else if (Boolean.TRUE.equals(request.getRemoveFromSprint())) {
            issue.setSprint(null);
        }

        // 3. Cập nhật LexoRank (nếu có - Phong)
        if (request.getNewBoardPosition() != null && !request.getNewBoardPosition().isEmpty()) {
            issue.setBoardPosition(request.getNewBoardPosition());
        }

        issue = issueRepository.save(issue); // @Version tự tăng

        return toResponse(issue);
    }

    @Override
    @Transactional
    public IssueResponse updateIssue(Long issueId, IssueUpdateRequest request) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue không tồn tại."));

        if (request.getSummary() != null) {
            issue.setSummary(request.getSummary());
        }
        if (request.getDescription() != null) {
            issue.setDescription(request.getDescription());
        }
        if (request.getType() != null) {
            issue.setType(request.getType());
        }
        if (request.getPriority() != null) {
            issue.setPriority(request.getPriority());
        }
        if (request.getStatusId() != null) {
            Status newStatus = statusRepository.findById(request.getStatusId())
                    .orElseThrow(() -> new RuntimeException("Status không tồn tại."));
            issue.setStatus(newStatus);
        }
        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId()).orElse(null);
            issue.setAssignee(assignee);
        }
        if (request.getStartDate() != null) {
            issue.setStartDate(request.getStartDate());
        }
        if (request.getDueDate() != null) {
            issue.setDueDate(request.getDueDate());
        }

        issue = issueRepository.save(issue);

        // Log Activity (Field Update)
        try {
            Long userId = (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            User currentUser = userRepository.findById(userId).orElseThrow();
            activityLogRepository.save(IssueActivityLog.builder()
                    .issue(issue).user(currentUser).actionType("UPDATE_ISSUE")
                    .payload(objectMapper.writeValueAsString(Map.of("summary", issue.getSummary()))).build());
        } catch (Exception e) {}

        return toResponse(issue);
    }

    @Override
    @Transactional
    public IssueResponse updateIssueSprint(Long issueId, Long sprintId) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue không tồn tại."));
        
        Sprint sprint = null;
        if (sprintId != null) {
            sprint = sprintRepository.findById(sprintId)
                    .orElseThrow(() -> new RuntimeException("Sprint không tồn tại."));
        }
        
        issue.setSprint(sprint);
        issue = issueRepository.save(issue);
        return toResponse(issue);
    }

    @Override
    @Transactional
    public void deleteIssue(Long issueId) {
        Issue issue = issueRepository.findById(issueId)
                .orElseThrow(() -> new RuntimeException("Issue không tồn tại."));
        issueRepository.delete(issue); // Soft delete qua @SQLDelete
    }

    private IssueResponse toResponse(Issue i) {
        return IssueResponse.builder()
                .id(i.getId())
                .projectId(i.getProject().getId())
                .projectName(i.getProject().getName())
                .issueKey(i.getIssueKey())
                .type(i.getType())
                .priority(i.getPriority())
                .summary(i.getSummary())
                .description(i.getDescription())
                .statusId(i.getStatus().getId())
                .statusName(i.getStatus().getName())
                .parentIssueId(i.getParentIssue() != null ? i.getParentIssue().getId() : null)
                .assigneeId(i.getAssignee() != null ? i.getAssignee().getId() : null)
                .assigneeName(i.getAssignee() != null ? i.getAssignee().getFullName() : null)
                .assigneeAvatarUrl(i.getAssignee() != null ? i.getAssignee().getAvatarUrl() : null)
                .reporterId(i.getReporter().getId())
                .reporterName(i.getReporter().getFullName())
                .reporterAvatarUrl(i.getReporter().getAvatarUrl())
                .boardPosition(i.getBoardPosition())
                .version(i.getVersion())
                .sprintId(i.getSprint() != null ? i.getSprint().getId() : null)
                .sprintName(i.getSprint() != null ? i.getSprint().getName() : null)
                .createdAt(i.getCreatedAt())
                .startDate(i.getStartDate())
                .dueDate(i.getDueDate())
                .subtasks(i.getSubtasks() != null ? i.getSubtasks().stream().map(this::toResponse).collect(java.util.stream.Collectors.toList()) : new java.util.ArrayList<>())
                .build();
    }
}
