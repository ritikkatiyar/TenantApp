package com.tenantliving.announcement.repository;

import com.tenantliving.announcement.domain.AnnouncementReceiptTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AnnouncementReceiptRepository extends JpaRepository<AnnouncementReceiptTbl, UUID> {

    Optional<AnnouncementReceiptTbl> findByAnnouncementIdAndUserId(UUID announcementId, UUID userId);

    boolean existsByAnnouncementIdAndUserId(UUID announcementId, UUID userId);

    java.util.List<AnnouncementReceiptTbl> findByUserIdAndAnnouncementIdIn(UUID userId, java.util.Collection<UUID> announcementIds);

    long countByAnnouncementId(UUID announcementId);

    @org.springframework.data.jpa.repository.Query("SELECT r.announcement.id, COUNT(r) FROM AnnouncementReceiptTbl r WHERE r.announcement.id IN :announcementIds GROUP BY r.announcement.id")
    java.util.List<Object[]> countReceiptsByAnnouncementIdIn(@org.springframework.data.repository.query.Param("announcementIds") java.util.Collection<UUID> announcementIds);
}
