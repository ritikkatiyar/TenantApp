package com.tenantliving.finance.event;

import com.tenantliving.common.event.RentPublishedEvent;
import com.tenantliving.notification.domain.NotificationChannel;
import com.tenantliving.notification.service.NotificationService;
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
        log.info("Sending rent published notification to tenant: {} for cycle: {}", event.getTenantUserId(), event.getRentCycleId());

        String title = "New Rent Statement Published";
        String body = String.format(
                "Dear Tenant, your rent statement for %s has been published. Total Amount Due: INR %s. Due Date: %s. Please pay online via the app.",
                event.getBillingMonth(),
                event.getTotalAmount().toString(),
                event.getDueDate().toString()
        );

        try {
            notificationService.send(
                    event.getTenantUserId().toString(),
                    NotificationChannel.EMAIL,
                    title,
                    body
            );
            log.info("Successfully sent rent statement notification to user: {}", event.getTenantUserId());
        } catch (Exception e) {
            log.error("Failed to send rent statement notification to user: {}", event.getTenantUserId(), e);
        }
    }
}
