package com.livic.notification.service.impl;

import com.livic.common.service.impl.AbstractCrudService;
import com.livic.notification.domain.NotificationChannel;
import com.livic.notification.domain.NotificationLogTbl;
import com.livic.notification.domain.NotificationStatus;
import com.livic.notification.repository.NotificationLogRepository;
import com.livic.notification.service.interfaces.NotificationLogCrudService;
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
