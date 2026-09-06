package com.livic.finance.event;

import com.livic.common.event.RentPublishedEvent;
import com.livic.notification.domain.NotificationChannel;
import com.livic.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class RentPublishedNotificationListener {

    private final NotificationService notificationService;

    @EventListener
    public void onRentPublished(RentPublishedEvent event) {
        String tenantUserId = event.getTenantUserId().toString();
        String billingMonth = event.getBillingMonth();
        String totalAmount = event.getTotalAmount().toString();
        String dueDate = event.getDueDate().toString();

        log.info("Sending rent published notifications to tenant: {} for cycle: {}", tenantUserId, event.getRentCycleId());

        String emailTitle = "New Rent Statement Published";
        String emailBody = String.format(
                "Dear Tenant, your rent statement for %s has been published. Total Amount Due: INR %s. Due Date: %s. Please pay online via the app.",
                billingMonth, totalAmount, dueDate
        );

        String pushTitle = "Rent Statement Published";
        String pushBody = String.format(
                "Your rent of INR %s for %s is ready. Due: %s. Tap to view and pay.",
                totalAmount, billingMonth, dueDate
        );

        String whatsappTitle = "Rent Statement Published";
        String whatsappBody = String.format(
                "Dear Tenant, your rent statement for %s has been published. Total Amount Due: INR %s. Due Date: %s. Please pay online via the Livic app.",
                billingMonth, totalAmount, dueDate
        );

        // 1. Dispatch Email
        try {
            notificationService.send(tenantUserId, NotificationChannel.EMAIL, emailTitle, emailBody);
            log.info("Successfully dispatched rent statement EMAIL to user: {}", tenantUserId);
        } catch (Exception e) {
            log.error("Failed to send rent statement EMAIL to user: {}", tenantUserId, e);
        }

        // 2. Dispatch Mobile Push
        try {
            notificationService.send(tenantUserId, NotificationChannel.PUSH, pushTitle, pushBody);
            log.info("Successfully dispatched rent statement PUSH to user: {}", tenantUserId);
        } catch (Exception e) {
            log.error("Failed to send rent statement PUSH to user: {}", tenantUserId, e);
        }

        // 3. Dispatch WhatsApp
        try {
            notificationService.send(tenantUserId, NotificationChannel.WHATSAPP, whatsappTitle, whatsappBody);
            log.info("Successfully dispatched rent statement WHATSAPP to user: {}", tenantUserId);
        } catch (Exception e) {
            log.error("Failed to send rent statement WHATSAPP to user: {}", tenantUserId, e);
        }
    }
}
