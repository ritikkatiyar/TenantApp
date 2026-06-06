package com.tenantliving.notification.repository;

import com.tenantliving.notification.domain.NotificationChannel;
import com.tenantliving.notification.domain.NotificationLogTbl;
import com.tenantliving.notification.domain.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationLogRepository extends JpaRepository<NotificationLogTbl, UUID> {
    List<NotificationLogTbl> findByRecipientId(UUID recipientId);
    List<NotificationLogTbl> findByStatus(NotificationStatus status);
    List<NotificationLogTbl> findByRecipientIdAndChannel(UUID recipientId, NotificationChannel channel);
}
