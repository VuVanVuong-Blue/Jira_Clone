package com.jira.clone.controllers;

import com.jira.clone.models.dtos.issue.*;
import com.jira.clone.repositories.SprintRepository;
import com.jira.clone.repositories.StatusRepository;
import com.jira.clone.models.entities.*;
import com.jira.clone.repositories.ProjectRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import com.jira.clone.repositories.IssueRepository;
import com.jira.clone.models.enums.SprintStatus;
import com.jira.clone.models.enums.StatusCategory;
import com.jira.clone.security.annotations.CheckProjectPermission;
import com.jira.clone.models.enums.Resource;
import com.jira.clone.models.enums.Action;
//Controller xử lý các API liên quan đến sprint và status
@RestController
@RequestMapping("/api")
public class SprintStatusController {

    private final SprintRepository sprintRepository;
    private final StatusRepository statusRepository;
    private final ProjectRepository projectRepository;
    private final IssueRepository issueRepository;

    public SprintStatusController(SprintRepository sprintRepository,
                                   StatusRepository statusRepository,
                                   ProjectRepository projectRepository,
                                   IssueRepository issueRepository) {
        this.sprintRepository = sprintRepository;
        this.statusRepository = statusRepository;
        this.projectRepository = projectRepository;
        this.issueRepository = issueRepository;
    }

    // ═══════ Controller xử lý sprint ═══════

    @PostMapping("/sprints")
    @CheckProjectPermission(resource = Resource.SPRINT, action = Action.CREATE, projectIdParam = "request")
    public ResponseEntity<SprintResponse> createSprint(@Valid @RequestBody SprintCreateRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project không tồn tại."));
        Sprint sprint = Sprint.builder()
                .project(project).name(request.getName())
                .startDate(request.getStartDate()).endDate(request.getEndDate())
                .build();
        sprint = sprintRepository.save(sprint);
        return ResponseEntity.ok(toSprintResponse(sprint));
    }
    //API lấy danh sách sprint theo project
    @GetMapping("/sprints/project/{projectId}")
    @CheckProjectPermission(resource = Resource.SPRINT, action = Action.VIEW, projectIdParam = "projectId")
    public ResponseEntity<List<SprintResponse>> getSprintsByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(sprintRepository.findByProjectId(projectId)
                .stream().map(this::toSprintResponse).collect(Collectors.toList()));
    }
    //API cập nhật sprint
    @PutMapping("/sprints/{id}")
    @CheckProjectPermission(resource = Resource.SPRINT, action = Action.EDIT, sprintIdParam = "id")
    public ResponseEntity<SprintResponse> updateSprint(@PathVariable Long id, @Valid @RequestBody SprintUpdateRequest request) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sprint không tồn tại."));
        
        if (request.getName() != null) sprint.setName(request.getName());
        if (request.getStartDate() != null) sprint.setStartDate(request.getStartDate());
        if (request.getEndDate() != null) sprint.setEndDate(request.getEndDate());
        if (request.getStatus() != null) sprint.setStatus(request.getStatus());

        sprint = sprintRepository.save(sprint);
        return ResponseEntity.ok(toSprintResponse(sprint));
    }
    //API xóa sprint
    @DeleteMapping("/sprints/{id}")
    @CheckProjectPermission(resource = Resource.SPRINT, action = Action.DELETE, sprintIdParam = "id")
    public ResponseEntity<Map<String, String>> deleteSprint(@PathVariable Long id) {
        Sprint sprint = sprintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sprint không tồn tại."));
        
        List<Issue> sprintIssues = issueRepository.findBySprintId(id);
        sprintIssues.forEach(issue -> {
            issue.setSprint(null);
            issueRepository.save(issue);
        });
        
        sprintRepository.delete(sprint);
        return ResponseEntity.ok(Map.of("message", "Đã xóa Sprint và chuyển các issue về Backlog."));
    }
    //API hoàn thành sprint
    @PostMapping("/sprints/{id}/complete")
    @CheckProjectPermission(resource = Resource.SPRINT, action = Action.EDIT, sprintIdParam = "id")
    public ResponseEntity<Map<String, String>> completeSprint(@PathVariable Long id, @RequestBody SprintCompleteRequest request) {
        Sprint currentSprint = sprintRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Sprint không tồn tại."));
        
        currentSprint.setStatus(SprintStatus.closed);
        sprintRepository.save(currentSprint);
        
        Sprint destinationSprint = null;
        if (request.getDestinationSprintId() != null) {
            destinationSprint = sprintRepository.findById(request.getDestinationSprintId())
                    .orElseThrow(() -> new RuntimeException("Sprint đích không tồn tại."));
        }
        
        List<Issue> currentIssues = issueRepository.findBySprintId(id);
        for (Issue issue : currentIssues) {
            if (issue.getStatus() != null && issue.getStatus().getCategory() != StatusCategory.done) {
                issue.setSprint(destinationSprint);
                issueRepository.save(issue);
            }
        }
        
        return ResponseEntity.ok(Map.of("message", "Đã đóng Sprint thành công."));
    }

    // ═══════ Controller xử lý status ═══════

    @PostMapping("/statuses")
    @CheckProjectPermission(resource = Resource.SETTINGS, action = Action.CREATE, projectIdParam = "request")
    public ResponseEntity<StatusResponse> createStatus(@Valid @RequestBody StatusCreateRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new RuntimeException("Project không tồn tại."));
        Status status = Status.builder()
                .project(project).name(request.getName())
                .category(request.getCategory())
                .boardPosition(request.getBoardPosition() != null ? request.getBoardPosition() : 0)
                .build();
        status = statusRepository.save(status);
        return ResponseEntity.ok(toStatusResponse(status));
    }
    //API lấy danh sách status theo project
    @GetMapping("/statuses/project/{projectId}")
    @CheckProjectPermission(resource = Resource.SETTINGS, action = Action.VIEW, projectIdParam = "projectId")
    public ResponseEntity<List<StatusResponse>> getStatusesByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(statusRepository.findByProjectIdOrderByBoardPositionAsc(projectId)
                .stream().map(this::toStatusResponse).collect(Collectors.toList()));
    }
    //API xóa status
    @DeleteMapping("/statuses/{id}")
    @CheckProjectPermission(resource = Resource.SETTINGS, action = Action.DELETE, statusIdParam = "id")
    public ResponseEntity<?> deleteStatus(@PathVariable Long id) {
        Status status = statusRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Status không tồn tại."));
        
        // Kiểm tra xem có issue nào đang ở trạng thái này không
        List<Issue> issues = issueRepository.findByProjectIdAndStatusIdOrderByBoardPositionAsc(status.getProject().getId(), id);
        if (!issues.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Không thể xoá trạng thái này vì vẫn còn công việc bên trong. Hãy chuyển chúng sang trạng thái khác trước."));
        }

        statusRepository.delete(status);
        return ResponseEntity.ok(Map.of("message", "Đã xoá trạng thái."));
    }
    //Hàm chuyển đổi sprint sang sprint response
    private SprintResponse toSprintResponse(Sprint s) {
        return SprintResponse.builder()
                .id(s.getId()).name(s.getName())
                .startDate(s.getStartDate()).endDate(s.getEndDate())
                .status(s.getStatus()).build();
    }
    //Hàm chuyển đổi status sang status response
    private StatusResponse toStatusResponse(Status s) {
        return StatusResponse.builder()
                .id(s.getId()).name(s.getName())
                .category(s.getCategory()).boardPosition(s.getBoardPosition())
                .build();
    }
}
