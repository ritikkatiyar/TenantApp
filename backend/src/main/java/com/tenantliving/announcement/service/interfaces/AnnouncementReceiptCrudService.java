package com.tenantliving.announcement.service.interfaces;

import com.tenantliving.announcement.domain.AnnouncementReceiptTbl;
import com.tenantliving.common.service.interfaces.CrudService;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AnnouncementReceiptCrudService extends CrudService<AnnouncementReceiptTbl, UUID> {
    Optional<AnnouncementReceiptTbl> findByAnnouncementIdAndUserId(UUID announcementId, UUID userId);
    boolean existsByAnnouncementIdAndUserId(UUID announcementId, UUID userId);
    List<AnnouncementReceiptTbl> findByUserIdAndAnnouncementIdIn(UUID userId, Collection<UUID> announcementIds);
    long countByAnnouncementId(UUID announcementId);
    List<Object[]> countReceiptsByAnnouncementIdIn(Collection<UUID> announcementIds);
}
