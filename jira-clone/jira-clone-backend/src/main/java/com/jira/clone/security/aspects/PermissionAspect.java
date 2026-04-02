package com.jira.clone.security.aspects;

import com.jira.clone.models.entities.Sprint;
import com.jira.clone.models.entities.Comment;
import com.jira.clone.models.entities.Status;
import com.jira.clone.repositories.SprintRepository;
import com.jira.clone.repositories.CommentRepository;
import com.jira.clone.repositories.StatusRepository;
import com.jira.clone.models.entities.Issue;
import com.jira.clone.models.entities.ProjectMember;
import com.jira.clone.models.entities.Role;
import com.jira.clone.models.enums.Action;
import com.jira.clone.models.enums.Resource;
import com.jira.clone.repositories.IssueRepository;
import com.jira.clone.repositories.IssueLinkRepository;
import com.jira.clone.repositories.ProjectMemberRepository;
import com.jira.clone.security.annotations.CheckProjectPermission;
import com.jira.clone.models.entities.IssueLink;
import lombok.RequiredArgsConstructor;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.lang.reflect.Method;

@Aspect
@Component
@RequiredArgsConstructor
public class PermissionAspect {

    private final ProjectMemberRepository projectMemberRepository;
    private final IssueRepository issueRepository;
    private final SprintRepository sprintRepository;
    private final CommentRepository commentRepository;
    private final StatusRepository statusRepository;
    private final IssueLinkRepository issueLinkRepository;

    @Before("@annotation(com.jira.clone.security.annotations.CheckProjectPermission)")
    public void checkPermission(JoinPoint joinPoint) {
        MethodSignature signature = (MethodSignature) joinPoint.getSignature();
        Method method = signature.getMethod();
        CheckProjectPermission checkPermission = method.getAnnotation(CheckProjectPermission.class);

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Chưa đăng nhập");
        }

        Long userId = (Long) auth.getPrincipal();
        Long projectId = extractProjectId(joinPoint, checkPermission);

        if (projectId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Không tìm thấy Project ID để kiểm tra quyền");
        }

        ProjectMember member = projectMemberRepository.findByProjectIdAndUserIdWithPermissions(projectId, userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Bạn không phải thành viên của dự án này"));

        Role role = member.getRole();
        Resource requiredResource = checkPermission.resource();
        Action requiredAction = checkPermission.action();

        boolean hasPerm = role.getPermissions().stream()
                .anyMatch(p -> p.getResource() == requiredResource && p.getAction() == requiredAction);

        if (!hasPerm) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, 
                    String.format("Bạn không có quyền %s trên mô-đun %s của dự án này", requiredAction, requiredResource));
        }
    }

    private Long extractProjectId(JoinPoint joinPoint, CheckProjectPermission annotation) {
        String projectIdParam = annotation.projectIdParam();
        String issueIdParam = annotation.issueIdParam();

        Object[] args = joinPoint.getArgs();
        String[] parameterNames = ((MethodSignature) joinPoint.getSignature()).getParameterNames();

        // 1. Trực tiếp từ projectIdParam (có thể là tham số Long hoặc nằm trong Obj)
        if (projectIdParam != null && !projectIdParam.isEmpty()) {
            for (int i = 0; i < parameterNames.length; i++) {
                if (parameterNames[i].equals(projectIdParam)) {
                    if (args[i] instanceof Long) {
                        return (Long) args[i];
                    }
                    // Nếu là Object (DTO), thử lấy qua Reflection
                    try {
                        Method getProjectIdMethod = args[i].getClass().getMethod("getProjectId");
                        return (Long) getProjectIdMethod.invoke(args[i]);
                    } catch (Exception e) {
                        // Tiếp tục thử cái khác
                    }
                }
            }
        }

        // 2. Từ issueIdParam -> projectId
        if (issueIdParam != null && !issueIdParam.isEmpty()) {
            for (int i = 0; i < parameterNames.length; i++) {
                if (parameterNames[i].equals(issueIdParam)) {
                    Long issueId = null;
                    if (args[i] instanceof Long) {
                        issueId = (Long) args[i];
                    } else if (args[i] != null) {
                        try {
                            Method m = args[i].getClass().getMethod("getIssueId");
                            issueId = (Long) m.invoke(args[i]);
                        } catch (Exception ignored) {}
                    }
                    if (issueId != null) {
                        Issue issue = issueRepository.findById(issueId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy Issue"));
                        return issue.getProject().getId();
                    }
                }
            }
        }

        String sprintIdParam = annotation.sprintIdParam();
        if (sprintIdParam != null && !sprintIdParam.isEmpty()) {
            for (int i = 0; i < parameterNames.length; i++) {
                if (parameterNames[i].equals(sprintIdParam)) {
                    Long sprintId = null;
                    if (args[i] instanceof Long) {
                        sprintId = (Long) args[i];
                    } else if (args[i] != null) {
                        try {
                            Method m = args[i].getClass().getMethod("getSprintId");
                            sprintId = (Long) m.invoke(args[i]);
                        } catch (Exception ignored) {}
                    }
                    if (sprintId != null) {
                        Sprint sprint = sprintRepository.findById(sprintId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy Sprint"));
                        return sprint.getProject().getId();
                    }
                }
            }
        }

        String commentIdParam = annotation.commentIdParam();
        if (commentIdParam != null && !commentIdParam.isEmpty()) {
            for (int i = 0; i < parameterNames.length; i++) {
                if (parameterNames[i].equals(commentIdParam)) {
                    Long commentId = null;
                    if (args[i] instanceof Long) {
                        commentId = (Long) args[i];
                    } else if (args[i] != null) {
                        try {
                            Method m = args[i].getClass().getMethod("getCommentId");
                            commentId = (Long) m.invoke(args[i]);
                        } catch (Exception ignored) {}
                    }
                    if (commentId != null) {
                        Comment comment = commentRepository.findById(commentId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy Comment"));
                        return comment.getIssue().getProject().getId();
                    }
                }
            }
        }

        String statusIdParam = annotation.statusIdParam();
        if (statusIdParam != null && !statusIdParam.isEmpty()) {
            for (int i = 0; i < parameterNames.length; i++) {
                if (parameterNames[i].equals(statusIdParam)) {
                    Long statusId = null;
                    if (args[i] instanceof Long) {
                        statusId = (Long) args[i];
                    } else if (args[i] != null) {
                        try {
                            Method m = args[i].getClass().getMethod("getStatusId");
                            statusId = (Long) m.invoke(args[i]);
                        } catch (Exception ignored) {}
                    }
                    if (statusId != null) {
                        Status status = statusRepository.findById(statusId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy Status"));
                        return status.getProject().getId();
                    }
                }
            }
        }

        String linkIdParam = annotation.linkIdParam();
        if (linkIdParam != null && !linkIdParam.isEmpty()) {
            for (int i = 0; i < parameterNames.length; i++) {
                if (parameterNames[i].equals(linkIdParam)) {
                    if (args[i] instanceof Long) {
                        Long linkId = (Long) args[i];
                        IssueLink link = issueLinkRepository.findById(linkId)
                                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy Liên kết"));
                        return link.getSourceIssue().getProject().getId();
                    }
                }
            }
        }

        // 3. Dự phòng: Tìm bất kỳ tham số nào là Long mang tên projectId hoặc object có getProjectId
        for (int i = 0; i < parameterNames.length; i++) {
            if ("projectId".equals(parameterNames[i]) && args[i] instanceof Long) {
                return (Long) args[i];
            }
            if (args[i] != null) {
                try {
                    Method getProjectIdMethod = args[i].getClass().getMethod("getProjectId");
                    return (Long) getProjectIdMethod.invoke(args[i]);
                } catch (Exception ignored) {}
            }
        }

        return null;
    }
}
