package com.livic.announcement.service.interfaces;

import com.livic.announcement.dto.AnnouncementDTOs.CreateAnnouncementRequest;
import com.livic.announcement.dto.AnnouncementDTOs.AnnouncementResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

public interface AnnouncementService {

    AnnouncementResponse createAnnouncement(CreateAnnouncementRequest request, UUID creatorId);

    Page<AnnouncementResponse> getNoticesForTenant(UUID tenantUserId, Pageable pageable);

    Page<AnnouncementResponse> getAnnouncementsForProperty(UUID propertyId, UUID userWithAccessId, Pageable pageable);

    void markAsRead(UUID announcementId, UUID tenantUserId);
}
