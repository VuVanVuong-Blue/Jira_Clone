package com.jira.clone.services.impl;

import com.jira.clone.models.entities.OtpTransaction;
import com.jira.clone.models.enums.OtpPurpose;
import com.jira.clone.repositories.OtpTransactionRepository;
import com.jira.clone.services.EmailService;
import com.jira.clone.services.OtpService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
public class OtpServiceImpl implements OtpService {

    private final OtpTransactionRepository otpTransactionRepository;
    private final EmailService emailService;

    @Value("${otp.expiration.minutes:5}")
    private int otpExpirationMinutes;

    public OtpServiceImpl(OtpTransactionRepository otpTransactionRepository,
                          EmailService emailService) {
        this.otpTransactionRepository = otpTransactionRepository;
        this.emailService = emailService;
    }

    @Override
    @Transactional
    public void sendOtp(String targetIdentifier, OtpPurpose purpose) {
        // Sinh mã OTP 6 chữ số
        String otpCode = String.format("%06d", new Random().nextInt(999999));

        OtpTransaction otp = OtpTransaction.builder()
                .targetIdentifier(targetIdentifier)
                .otpCode(otpCode)
                .purpose(purpose)
                .expiresAt(LocalDateTime.now().plusMinutes(otpExpirationMinutes))
                .isUsed(false)
                .build();
        otpTransactionRepository.save(otp);

        // Gửi email qua Brevo
        emailService.sendOtpEmail(targetIdentifier, otpCode);
    }

    @Override
    @Transactional
    public boolean verifyOtp(String targetIdentifier, String otpCode) {
        Optional<OtpTransaction> otpOpt = otpTransactionRepository
                .findTopByTargetIdentifierOrderByCreatedAtDesc(targetIdentifier);

        if (otpOpt.isEmpty()) return false;

        OtpTransaction otp = otpOpt.get();

        if (otp.getIsUsed()) return false;
        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) return false;
        if (!otp.getOtpCode().equals(otpCode)) return false;

        // Đánh dấu đã sử dụng
        otp.setIsUsed(true);
        otpTransactionRepository.save(otp);
        return true;
    }
}
