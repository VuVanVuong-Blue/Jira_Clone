package com.jira.clone.services;

import com.jira.clone.models.enums.OtpPurpose;

public interface OtpService {
    /**
     * Sinh OTP 6 chữ số, lưu DB, gửi email qua Brevo.
     */
    void sendOtp(String targetIdentifier, OtpPurpose purpose);

    /**
     * Xác thực mã OTP. Trả về true nếu hợp lệ và chưa hết hạn.
     */
    boolean verifyOtp(String targetIdentifier, String otpCode);
}
