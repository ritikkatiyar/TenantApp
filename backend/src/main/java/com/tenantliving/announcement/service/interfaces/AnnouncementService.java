package com.tenantliving.announcement.service.interfaces;

import com.tenantliving.announcement.dto.AnnouncementDTOs.CreateAnnouncementRequest;
import com.tenantliving.announcement.dto.AnnouncementDTOs.AnnouncementResponse;

import java.util.List;
import java.util.UUID;

public interface AnnouncementService {

    AnnouncementResponse createAnnouncement(CreateAnnouncementRequest request, UUID creatorId);

    List<AnnouncementResponse> getNoticesForTenant(UUID tenantUserId);

    List<AnnouncementResponse> getAnnouncementsForProperty(UUID propertyId, UUID userWithAccessId);

    void markAsRead(UUID announcementId, UUID tenantUserId);
}
