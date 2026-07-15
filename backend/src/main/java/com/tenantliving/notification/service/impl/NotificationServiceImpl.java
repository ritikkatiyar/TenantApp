package com.tenantliving.notification.service.impl;

import com.tenantliving.notification.domain.NotificationChannel;
import com.tenantliving.notification.domain.NotificationLogTbl;
import com.tenantliving.notification.domain.NotificationStatus;
import com.tenantliving.notification.service.interfaces.NotificationLogCrudService;
import com.tenantliving.notification.service.NotificationChannelSender;
import com.tenantliving.notification.service.NotificationService;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.util.ArrayList;
import java.util.Objects;
import java.util.stream.Collectors;

/**
 * Core orchestrator for resolving the correct NotificationChannelSender strategy,
 * dispatching messages, and persisting audit logs.
 *
 * Design Patterns applied:
 * - Strategy Pattern: Iterates the list of all registered NotificationChannelSender beans
 *   and selects the first one that supports the requested channel.
 * - SRP: Responsible only for routing, log persistence, and error handling.
 * - DIP: Depends on abstractions (NotificationChannelSender, UserService interfaces).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    /** All NotificationChannelSender @Component beans are auto-injected here by Spring */
    private final List<NotificationChannelSender> senders;
    private final NotificationLogCrudService notificationLogCrudService;
    private final UserQueryService userQueryService;

    @Override
    public void send(String recipientUserId, NotificationChannel channel, String title, String body) {
        UserTbl recipient;
        try {
            recipient = userQueryService.getUserById(UUID.fromString(recipientUserId));
        } catch (Exception e) {
            log.warn("[NotificationService] Recipient user not found: {}. Skipping.", recipientUserId);
            return;
        }

        // Resolve recipient contact address based on channel
        String address = resolveAddress(recipient, channel);
        if (address == null) {
            log.warn("[NotificationService] No {} contact on record for user {}. Skipping.", channel, recipientUserId);
            return;
        }

        // Persist an audit log record with PENDING status
        NotificationLogTbl logEntry = NotificationLogTbl.builder()
                .recipient(recipient)
                .channel(channel)
                .recipientAddress(address)
                .title(title)
                .body(body)
                .status(NotificationStatus.PENDING)
                .build();
        notificationLogCrudService.save(logEntry);

        // Resolve the first matching strategy sender (Strategy Pattern)
        NotificationChannelSender sender = senders.stream()
                .filter(s -> s.supports(channel))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No sender found for channel: " + channel));

        // Dispatch and update audit log status
        try {
            sender.send(address, title, body);
            logEntry.setStatus(NotificationStatus.SENT);
        } catch (Exception e) {
            log.error("[NotificationService] Failed to send {} notification to {}: {}", channel, address, e.getMessage());
            logEntry.setStatus(NotificationStatus.FAILED);
            logEntry.setErrorMessage(e.getMessage());
        } finally {
            notificationLogCrudService.save(logEntry);
        }
    }

    @Override
    public void sendBulk(List<String> recipientUserIds, NotificationChannel channel, String title, String body) {
        List<UUID> uuids = recipientUserIds.stream()
                .map(id -> {
                    try { return UUID.fromString(id); }
                    catch (Exception e) { return null; }
                })
                .filter(Objects::nonNull)
                .collect(Collectors.toList());

        if (uuids.isEmpty()) return;

        Map<UUID, UserTbl> recipients = userQueryService.getUsersByIds(uuids);
        List<NotificationLogTbl> logs = new ArrayList<>();

        for (UUID uuid : uuids) {
            UserTbl user = recipients.get(uuid);
            if (user == null) continue;
            String address = resolveAddress(user, channel);
            if (address == null) continue;

            NotificationLogTbl logEntry = NotificationLogTbl.builder()
                    .recipient(user)
                    .channel(channel)
                    .recipientAddress(address)
                    .title(title)
                    .body(body)
                    .status(NotificationStatus.PENDING)
                    .build();
            logs.add(logEntry);
        }

        if (logs.isEmpty()) return;

        notificationLogCrudService.saveAll(logs);

        NotificationChannelSender sender = senders.stream()
                .filter(s -> s.supports(channel))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No sender found for channel: " + channel));

        for (NotificationLogTbl logEntry : logs) {
            try {
                sender.send(logEntry.getRecipientAddress(), title, body);
                logEntry.setStatus(NotificationStatus.SENT);
            } catch (Exception e) {
                log.error("[NotificationService] Failed to send {} notification to {}: {}", channel, logEntry.getRecipientAddress(), e.getMessage());
                logEntry.setStatus(NotificationStatus.FAILED);
                logEntry.setErrorMessage(e.getMessage());
            }
        }

        notificationLogCrudService.saveAll(logs);
    }

    /**
     * Resolves the recipient's contact address from their user record based on the channel.
     * EMAIL → authUid (email), WHATSAPP/SMS → phoneNumber, PUSH → not yet implemented.
     */
    private String resolveAddress(UserTbl user, NotificationChannel channel) {
        return switch (channel) {
            case EMAIL -> user.getAuthUid();
            case WHATSAPP, SMS -> user.getPhoneNumber();
            case PUSH -> null;
        };
    }
}
