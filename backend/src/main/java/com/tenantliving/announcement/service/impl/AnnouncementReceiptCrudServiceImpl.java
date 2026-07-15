package com.tenantliving.announcement.service.impl;

import com.tenantliving.announcement.domain.AnnouncementReceiptTbl;
import com.tenantliving.announcement.repository.AnnouncementReceiptRepository;
import com.tenantliving.announcement.service.interfaces.AnnouncementReceiptCrudService;
import com.tenantliving.common.service.impl.AbstractCrudService;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class AnnouncementReceiptCrudServiceImpl extends AbstractCrudService<AnnouncementReceiptTbl, UUID, AnnouncementReceiptRepository> implements AnnouncementReceiptCrudService {

    public AnnouncementReceiptCrudServiceImpl(AnnouncementReceiptRepository repository) {
        super(repository);
    }

    @Override
    public Optional<AnnouncementReceiptTbl> findByAnnouncementIdAndUserId(UUID announcementId, UUID userId) {
        return repository.findByAnnouncementIdAndUserId(announcementId, userId);
    }

    @Override
    public boolean existsByAnnouncementIdAndUserId(UUID announcementId, UUID userId) {
        return repository.existsByAnnouncementIdAndUserId(announcementId, userId);
    }

    @Override
    public List<AnnouncementReceiptTbl> findByUserIdAndAnnouncementIdIn(UUID userId, Collection<UUID> announcementIds) {
        return repository.findByUserIdAndAnnouncementIdIn(userId, announcementIds);
    }

    @Override
    public long countByAnnouncementId(UUID announcementId) {
        return repository.countByAnnouncementId(announcementId);
    }

    @Override
    public List<Object[]> countReceiptsByAnnouncementIdIn(Collection<UUID> announcementIds) {
        return repository.countReceiptsByAnnouncementIdIn(announcementIds);
    }
}
