package com.livic.notification.service.interfaces;

import com.livic.notification.domain.NotificationChannel;
import com.livic.notification.domain.NotificationLogTbl;
import com.livic.notification.domain.NotificationStatus;
import com.livic.common.service.interfaces.CrudService;

import java.util.List;
import java.util.UUID;

public interface NotificationLogCrudService extends CrudService<NotificationLogTbl, UUID> {
    List<NotificationLogTbl> findByRecipientId(UUID recipientId);
    List<NotificationLogTbl> findByStatus(NotificationStatus status);
    List<NotificationLogTbl> findByRecipientIdAndChannel(UUID recipientId, NotificationChannel channel);
}
