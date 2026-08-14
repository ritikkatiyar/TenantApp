package com.livic.notification.service.impl;

import com.livic.notification.config.EmailProperties;
import com.livic.notification.domain.NotificationChannel;
import com.livic.notification.service.NotificationChannelSender;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.annotation.Order;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.stereotype.Component;

import java.util.Properties;

@Component
@Order(1)
@ConditionalOnProperty(prefix = "email", name = "enabled", havingValue = "true")
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationSender implements NotificationChannelSender {

    private final EmailProperties emailProperties;

    @Override
    public boolean supports(NotificationChannel channel) {
        return channel == NotificationChannel.EMAIL;
    }

    @Override
    public void send(String recipientAddress, String title, String body) {
        log.info("[EmailNotificationSender] Attempting to send email to {}", recipientAddress);
        try {
            JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
            mailSender.setHost(emailProperties.getHost());
            mailSender.setPort(emailProperties.getPort());
            mailSender.setUsername(emailProperties.getUsername());
            mailSender.setPassword(emailProperties.getPassword());

            Properties props = mailSender.getJavaMailProperties();
            props.put("mail.transport.protocol", "smtp");
            props.put("mail.smtp.auth", "true");
            props.put("mail.smtp.starttls.enable", "true");
            props.put("mail.debug", "false");

            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(emailProperties.getFromAddress());
            message.setTo(recipientAddress);
            message.setSubject(title);
            message.setText(body);

            mailSender.send(message);
            log.info("[EmailNotificationSender] Email sent successfully to {}", recipientAddress);
        } catch (Exception e) {
            log.error("[EmailNotificationSender] Failed to send email to {}: {}", recipientAddress, e.getMessage());
            throw new RuntimeException("Email delivery failed: " + e.getMessage(), e);
        }
    }
}
