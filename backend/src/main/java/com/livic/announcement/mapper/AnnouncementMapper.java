package com.livic.announcement.mapper;

import com.livic.announcement.domain.AnnouncementTbl;
import com.livic.announcement.dto.AnnouncementDTOs.AnnouncementResponse;
import com.livic.announcement.dto.AnnouncementDTOs.CreateAnnouncementRequest;

import java.util.UUID;

public final class AnnouncementMapper {

    private AnnouncementMapper() {
    }

    public static AnnouncementTbl toEntity(CreateAnnouncementRequest request, UUID propertyId, UUID creatorId) {
        if (request == null) {
            return null;
        }
        return AnnouncementTbl.builder()
                .propertyId(propertyId)
                .creatorId(creatorId)
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .severity(request.getSeverity())
                .targetType(request.getTargetType())
                .targetValue(request.getTargetValue())
                .metadata(request.getMetadata())
                .build();
    }

    public static AnnouncementResponse toResponse(AnnouncementTbl announcement, String creatorName, boolean read, Long readCount, Long totalRecipientsCount) {
        if (announcement == null) {
            return null;
        }
        return AnnouncementResponse.builder()
                .id(announcement.getId())
                .propertyId(announcement.getPropertyId())
                .creatorId(announcement.getCreatorId())
                .creatorName(creatorName)
                .title(announcement.getTitle())
                .content(announcement.getContent())
                .category(announcement.getCategory())
                .severity(announcement.getSeverity())
                .targetType(announcement.getTargetType())
                .targetValue(announcement.getTargetValue())
                .metadata(announcement.getMetadata())
                .createdAt(announcement.getCreatedAt())
                .read(read)
                .readCount(readCount)
                .totalRecipientsCount(totalRecipientsCount)
                .build();
    }
}
