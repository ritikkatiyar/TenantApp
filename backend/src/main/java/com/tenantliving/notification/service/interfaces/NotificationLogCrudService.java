package com.tenantliving.notification.service.interfaces;

import com.tenantliving.notification.domain.NotificationChannel;
import com.tenantliving.notification.domain.NotificationLogTbl;
import com.tenantliving.notification.domain.NotificationStatus;
import com.tenantliving.common.service.interfaces.CrudService;

import java.util.List;
import java.util.UUID;

public interface NotificationLogCrudService extends CrudService<NotificationLogTbl, UUID> {
    List<NotificationLogTbl> findByRecipientId(UUID recipientId);
    List<NotificationLogTbl> findByStatus(NotificationStatus status);
    List<NotificationLogTbl> findByRecipientIdAndChannel(UUID recipientId, NotificationChannel channel);
}
