package com.jira.clone.services;

import com.jira.clone.models.entities.Issue;
import com.jira.clone.models.enums.NotificationType;
import com.jira.clone.repositories.IssueRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class DeadlineReminderService {

    private final IssueRepository issueRepository;
    private final NotificationService notificationService; // Tạo chuông 🔔
    private final EmailService emailService;               // Gửi email 📧

    public DeadlineReminderService(IssueRepository issueRepository,
                                   NotificationService notificationService,
                                   EmailService emailService) {
        this.issueRepository     = issueRepository;
        this.notificationService = notificationService;
        this.emailService        = emailService;
    }

    /**
     * Chạy mỗi ngày lúc 08:00 sáng.
     * Cron: "giây phút giờ ngày tháng thứ"
     *
     * ⚡ TEST NHANH: Đổi thành "0 *\/1 * * * *" để chạy mỗi 1 phút
     *    (Nhớ đổi lại "0 0 8 * * *" sau khi test xong)
     */
    @Scheduled(cron = "0 */1 * * * *")
    @Transactional
    public void sendDeadlineReminders() {
        LocalDateTime startOfTomorrow = LocalDate.now().plusDays(1).atStartOfDay();
        LocalDateTime endOfTomorrow   = startOfTomorrow.plusDays(1).minusSeconds(1);

        System.out.println("══════════════════════════════════════════════════════");
        System.out.println("⏰ DEADLINE REMINDER: Đang quét issues sắp hết hạn...");
        System.out.println("   Khoảng thời gian: " + startOfTomorrow + " → " + endOfTomorrow);

        List<Issue> issues = issueRepository.findIssuesDueTomorrow(startOfTomorrow, endOfTomorrow);

        System.out.println("   📋 Tìm thấy " + issues.size() + " issue(s) sắp đến hạn.");

        if (issues.isEmpty()) {
            System.out.println("   ✅ Không có issue nào cần nhắc hôm nay.");
            System.out.println("══════════════════════════════════════════════════════");
            return;
        }

        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

        for (Issue issue : issues) {
            try {
                var assignee      = issue.getAssignee();
                String email      = assignee.getEmail();
                String name       = assignee.getFullName();
                String projectName = (issue.getProject() != null)
                                     ? issue.getProject().getName() : "N/A";
                String dueDate    = issue.getDueDate().format(fmt);

                // ═══ BƯỚC 1: Tạo thông báo in-app → hiện lên chuông 🔔 ═══
                notificationService.createIssueNotification(
                    assignee,                          // recipient: người được giao
                    null,                              // actor: null (hệ thống tự gửi)
                    issue,                             // issue liên quan → bấm "Xem" vào issue
                    NotificationType.deadline_reminder
                );
                System.out.println("   🔔 Đã tạo notification in-app cho: " + name
                                   + " [" + issue.getIssueKey() + "]");

                // ═══ BƯỚC 2: Gửi email backup 📧 ═══
                if (email != null) {
                    emailService.sendDeadlineReminderEmail(
                        email, name,
                        issue.getIssueKey(),
                        issue.getSummary(),
                        dueDate,
                        projectName
                    );
                } else {
                    System.out.println("   ⚠️ Bỏ qua email cho " + issue.getIssueKey()
                                       + ": assignee không có email");
                }

            } catch (Exception e) {
                System.err.println("   ❌ Lỗi khi xử lý issue "
                                   + issue.getIssueKey() + ": " + e.getMessage());
                e.printStackTrace();
            }
        }

        System.out.println("⏰ DEADLINE REMINDER: Hoàn tất xử lý " + issues.size() + " issue(s).");
        System.out.println("══════════════════════════════════════════════════════");
    }
}
