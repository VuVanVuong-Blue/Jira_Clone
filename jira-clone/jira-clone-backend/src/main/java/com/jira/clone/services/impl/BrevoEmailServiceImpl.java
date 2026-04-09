package com.jira.clone.services.impl;

import com.jira.clone.services.EmailService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Gửi email OTP thông qua Brevo (Sendinblue) Transactional Email API v3.
 */
@Service
public class BrevoEmailServiceImpl implements EmailService {

    private static final String BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

    @Value("${brevo.api.key}")
    private String brevoApiKey;

    @Value("${brevo.sender.email}")
    private String senderEmail;

    @Value("${brevo.sender.name}")
    private String senderName;

    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public void sendOtpEmail(String toEmail, String otpCode) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey);

        Map<String, Object> sender = new HashMap<>();
        sender.put("email", senderEmail);
        sender.put("name", senderName);

        Map<String, Object> recipient = new HashMap<>();
        recipient.put("email", toEmail);

        Map<String, Object> body = new HashMap<>();
        body.put("sender", sender);
        body.put("to", List.of(recipient));
        body.put("subject", "Jira Clone - Mã xác thực OTP của bạn");
        body.put("htmlContent",
            "<div style='font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8f9fa;border-radius:12px'>"
            + "<h2 style='color:#0052CC;margin-bottom:8px'>Jira Clone</h2>"
            + "<p>Xin chào,</p>"
            + "<p>Mã xác thực OTP của bạn là:</p>"
            + "<div style='text-align:center;margin:24px 0'>"
            + "<span style='font-size:36px;font-weight:bold;letter-spacing:8px;color:#0052CC;background:#e3f2fd;padding:12px 24px;border-radius:8px'>"
            + otpCode
            + "</span></div>"
            + "<p>Mã này có hiệu lực trong <b>5 phút</b>. Không chia sẻ mã này với bất kỳ ai.</p>"
            + "<hr style='border:none;border-top:1px solid #ddd;margin:24px 0'>"
            + "<p style='color:#888;font-size:12px'>Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>"
            + "</div>"
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

        try {
            System.out.println("═══════════════════════════════════════");
            System.out.println("📧 BREVO: Đang gửi OTP...");
            System.out.println("   Sender: " + senderEmail);
            System.out.println("   To: " + toEmail);
            System.out.println("   OTP: " + otpCode);

            ResponseEntity<String> response = restTemplate.exchange(
                    BREVO_API_URL, HttpMethod.POST, request, String.class);

            System.out.println("✅ BREVO: Gửi thành công! Status: " + response.getStatusCode());
            System.out.println("   Response: " + response.getBody());
            System.out.println("═══════════════════════════════════════");

        } catch (HttpClientErrorException e) {
            System.err.println("❌ BREVO LỖI: " + e.getStatusCode());
            System.err.println("   Response: " + e.getResponseBodyAsString());
            System.err.println("═══════════════════════════════════════");
            throw new RuntimeException(
                "Gửi email OTP thất bại! Brevo trả về: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            System.err.println("❌ BREVO EXCEPTION: " + e.getMessage());
            throw new RuntimeException("Gửi email OTP thất bại: " + e.getMessage());
        }
    }

    @Override
    public void sendInvitationEmail(String toEmail, String inviterName, String projectName) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey);

        Map<String, Object> body = new HashMap<>();
        body.put("sender", Map.of("email", senderEmail, "name", senderName));
        body.put("to", List.of(Map.of("email", toEmail)));
        body.put("subject", "Jira Clone - Bạn có lời mời tham gia dự án!");
        body.put("htmlContent",
            "<div style='font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#f8f9fa;border-radius:12px'>"
            + "<h2 style='color:#0052CC;margin-bottom:8px'>Jira Clone</h2>"
            + "<p>Xin chào,</p>"
            + "<p>Bạn vừa nhận được lời mời tham gia dự án <b>" + projectName + "</b> từ <b>" + inviterName + "</b>.</p>"
            + "<p>Vui lòng đăng nhập vào Jira Clone để xem chi tiết và chấp nhận lời mời tham gia đội ngũ.</p>"
            + "<div style='text-align:center;margin:32px 0'>"
            + "<a href='http://localhost:3000/notifications' style='background:#0052CC;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold'>Xem lời mời ngay</a>"
            + "</div>"
            + "<hr style='border:none;border-top:1px solid #ddd;margin:24px 0'>"
            + "<p style='color:#888;font-size:12px'>Đây là email tự động, vui lòng không phản hồi.</p>"
            + "</div>"
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        try {
            restTemplate.exchange(BREVO_API_URL, HttpMethod.POST, request, String.class);
            System.out.println("✅ BREVO: Đã gửi email mời tham gia dự án tới " + toEmail);
        } catch (Exception e) {
            System.err.println("❌ BREVO LỖI GỬI LỜI MỜI: " + e.getMessage());
        }
    }

    @Override
    public void sendDeadlineReminderEmail(String toEmail, String assigneeName,
                                          String issueKey, String summary,
                                          String dueDate, String projectName) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("api-key", brevoApiKey);

        String htmlContent =
            "<div style='font-family:Arial,sans-serif;max-width:520px;margin:0 auto;"
            + "padding:32px;background:#f8f9fa;border-radius:12px'>"
            + "<h2 style='color:#DE350B;margin-bottom:4px'>⚠️ Jira Clone</h2>"
            + "<p style='color:#777;margin-top:0'>Nhắc nhở: Deadline sắp đến hạn</p>"
            + "<hr style='border:none;border-top:1px solid #e0e0e0;margin:16px 0'>"
            + "<p>Xin chào <b>" + assigneeName + "</b>,</p>"
            + "<p>Task sau đây của bạn trong dự án <b>" + projectName + "</b> sẽ "
            + "<b style='color:#DE350B'>hết hạn vào ngày mai</b>:</p>"
            + "<div style='background:#fff;border-left:4px solid #DE350B;"
            + "padding:16px 20px;border-radius:6px;margin:20px 0;"
            + "box-shadow:0 1px 4px rgba(0,0,0,0.08)'>"
            + "  <p style='margin:0;font-size:12px;color:#999;letter-spacing:1px'>"
            + issueKey + "</p>"
            + "  <p style='margin:8px 0 6px;font-size:16px;font-weight:bold;color:#172B4D'>"
            + summary + "</p>"
            + "  <p style='margin:0;color:#DE350B;font-weight:600'>📅 Hạn chót: " + dueDate + "</p>"
            + "</div>"
            + "<p style='color:#555'>Vui lòng hoàn thành hoặc cập nhật tiến độ task này sớm nhất có thể.</p>"
            + "<div style='text-align:center;margin:28px 0'>"
            + "  <a href='http://localhost:3000' "
            + "     style='background:#0052CC;color:white;padding:12px 28px;"
            + "            border-radius:6px;text-decoration:none;font-weight:bold;"
            + "            font-size:14px'>Vào Jira Clone ngay →</a>"
            + "</div>"
            + "<hr style='border:none;border-top:1px solid #e0e0e0;margin:24px 0'>"
            + "<p style='color:#bbb;font-size:12px;text-align:center'>"
            + "Đây là email tự động từ Jira Clone. Vui lòng không phản hồi.</p>"
            + "</div>";

        Map<String, Object> body = new HashMap<>();
        body.put("sender", Map.of("email", senderEmail, "name", senderName));
        body.put("to", List.of(Map.of("email", toEmail)));
        body.put("subject", "⚠️ [Jira Clone] Task \"" + summary + "\" sắp hết hạn vào ngày mai!");
        body.put("htmlContent", htmlContent);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
        try {
            restTemplate.exchange(BREVO_API_URL, HttpMethod.POST, request, String.class);
            System.out.println("✅ DEADLINE REMINDER: Đã gửi email tới " + toEmail
                               + " cho issue " + issueKey);
        } catch (Exception e) {
            System.err.println("❌ DEADLINE REMINDER: Gửi thất bại tới " + toEmail
                               + " — " + e.getMessage());
        }
    }
}
