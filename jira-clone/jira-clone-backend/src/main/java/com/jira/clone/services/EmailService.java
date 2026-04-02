package com.jira.clone.services;

/**
 * Service gửi email thông qua Brevo (Sendinblue) API.
 */
public interface EmailService {
    void sendOtpEmail(String toEmail, String otpCode);
    void sendInvitationEmail(String toEmail, String inviterName, String projectName);
}
