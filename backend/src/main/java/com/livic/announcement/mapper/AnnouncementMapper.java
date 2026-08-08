package com.livic.announcement.mapper;

import com.livic.announcement.domain.AnnouncementTbl;
import com.livic.announcement.dto.AnnouncementDTOs.CreateAnnouncementRequest;
import com.livic.announcement.dto.AnnouncementDTOs.AnnouncementResponse;
import com.livic.property.domain.PropertyTbl;
import com.livic.user.domain.UserTbl;

public final class AnnouncementMapper {

    private AnnouncementMapper() {
    }

    public static AnnouncementTbl toEntity(CreateAnnouncementRequest request, PropertyTbl property, UserTbl creator) {
        if (request == null) {
            return null;
        }
        return AnnouncementTbl.builder()
                .property(property)
                .creator(creator)
                .title(request.getTitle())
                .content(request.getContent())
                .category(request.getCategory())
                .severity(request.getSeverity())
                .targetType(request.getTargetType())
                .targetValue(request.getTargetValue())
                .metadata(request.getMetadata())
                .build();
    }

    public static AnnouncementResponse toResponse(AnnouncementTbl announcement, boolean read, Long readCount, Long totalRecipientsCount) {
        if (announcement == null) {
            return null;
        }
        String creatorName = announcement.getCreator() != null ? announcement.getCreator().getFullName() : "System";
        return AnnouncementResponse.builder()
                .id(announcement.getId())
                .propertyId(announcement.getProperty().getId())
                .creatorId(announcement.getCreator() != null ? announcement.getCreator().getId() : null)
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
