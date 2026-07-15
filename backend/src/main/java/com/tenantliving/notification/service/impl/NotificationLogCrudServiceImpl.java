package com.tenantliving.notification.service.impl;

import com.tenantliving.common.service.impl.AbstractCrudService;
import com.tenantliving.notification.domain.NotificationChannel;
import com.tenantliving.notification.domain.NotificationLogTbl;
import com.tenantliving.notification.domain.NotificationStatus;
import com.tenantliving.notification.repository.NotificationLogRepository;
import com.tenantliving.notification.service.interfaces.NotificationLogCrudService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class NotificationLogCrudServiceImpl extends AbstractCrudService<NotificationLogTbl, UUID, NotificationLogRepository> implements NotificationLogCrudService {

    public NotificationLogCrudServiceImpl(NotificationLogRepository repository) {
        super(repository);
    }

    @Override
    public List<NotificationLogTbl> findByRecipientId(UUID recipientId) {
        return repository.findByRecipientId(recipientId);
    }

    @Override
    public List<NotificationLogTbl> findByStatus(NotificationStatus status) {
        return repository.findByStatus(status);
    }

    @Override
    public List<NotificationLogTbl> findByRecipientIdAndChannel(UUID recipientId, NotificationChannel channel) {
        return repository.findByRecipientIdAndChannel(recipientId, channel);
    }
}
