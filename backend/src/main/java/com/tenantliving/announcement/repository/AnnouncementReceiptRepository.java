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

    long countByAnnouncementId(UUID announcementId);
}
