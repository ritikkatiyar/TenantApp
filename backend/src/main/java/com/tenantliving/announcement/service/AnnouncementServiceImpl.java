package com.tenantliving.announcement.service;

import com.tenantliving.announcement.domain.*;
import com.tenantliving.announcement.dto.AnnouncementDTOs.CreateAnnouncementRequest;
import com.tenantliving.announcement.dto.AnnouncementDTOs.AnnouncementResponse;
import com.tenantliving.announcement.repository.AnnouncementReceiptRepository;
import com.tenantliving.announcement.repository.AnnouncementRepository;
import com.tenantliving.announcement.service.interfaces.AnnouncementService;
import com.tenantliving.common.domain.LeaseStatus;
import com.tenantliving.common.domain.BaseEntity;
import com.tenantliving.common.event.AnnouncementBroadcastEvent;
import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.service.interfaces.LeaseService;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.domain.UnitTbl;
import com.tenantliving.property.service.interfaces.PropertyService;
import com.tenantliving.property.service.interfaces.UnitService;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementRepository announcementRepository;
    private final AnnouncementReceiptRepository announcementReceiptRepository;
    private final PropertyService propertyService;
    private final UserService userService;
    private final LeaseService leaseService;
    private final UnitService unitService;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public AnnouncementResponse createAnnouncement(CreateAnnouncementRequest request, UUID creatorId) {
        PropertyTbl property = propertyService.getPropertyById(request.getPropertyId());
        UserTbl creator = userService.getUserById(creatorId);

        AnnouncementTbl announcement = AnnouncementTbl.builder()
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

        announcement = announcementRepository.save(announcement);

        // Fetch recipients user IDs to trigger notifications
        List<String> recipientUserIds = getRecipientUserIds(property.getId(), request.getTargetType(), request.getTargetValue());

        // Publish Spring Event to trigger Notification module listeners
        AnnouncementBroadcastEvent event = new AnnouncementBroadcastEvent(
                this,
                announcement.getId().toString(),
                announcement.getTitle(),
                announcement.getContent(),
                announcement.getCategory().name(),
                announcement.getSeverity().name(),
                recipientUserIds
        );
        eventPublisher.publishEvent(event);

        return mapToResponse(announcement, false, 0L, (long) recipientUserIds.size());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getNoticesForTenant(UUID tenantUserId) {
        LeaseTbl activeLease = leaseService.findByUserIdAndStatus(tenantUserId, LeaseStatus.ACTIVE)
                .stream()
                .findFirst()
                .orElse(null);

        if (activeLease == null || activeLease.getUnit() == null || activeLease.getUnit().getProperty() == null) {
            return Collections.emptyList();
        }

        UUID propertyId = activeLease.getUnit().getProperty().getId();
        String floorStr = String.valueOf(activeLease.getUnit().getFloor());
        String unitIdStr = activeLease.getUnit().getId().toString();

        List<AnnouncementTbl> announcements = announcementRepository.findNoticesForTenant(propertyId, floorStr, unitIdStr);

        return announcements.stream()
                .map(announcement -> {
                    boolean isRead = announcementReceiptRepository.existsByAnnouncementIdAndUserId(announcement.getId(), tenantUserId);
                    return mapToResponse(announcement, isRead, null, null);
                })
                .sorted(Comparator.comparing(AnnouncementResponse::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AnnouncementResponse> getAnnouncementsForProperty(UUID propertyId, UUID userWithAccessId) {
        List<AnnouncementTbl> announcements = announcementRepository.findByPropertyId(propertyId);

        return announcements.stream()
                .map(announcement -> {
                    long readCount = announcementReceiptRepository.countByAnnouncementId(announcement.getId());
                    List<String> recipients = getRecipientUserIds(propertyId, announcement.getTargetType(), announcement.getTargetValue());
                    long totalRecipients = recipients.size();

                    return mapToResponse(announcement, false, readCount, totalRecipients);
                })
                .sorted(Comparator.comparing(AnnouncementResponse::getCreatedAt).reversed())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markAsRead(UUID announcementId, UUID tenantUserId) {
        AnnouncementTbl announcement = announcementRepository.findById(announcementId)
                .orElseThrow(() -> new IllegalArgumentException("Announcement not found with ID: " + announcementId));

        UserTbl user = userService.getUserById(tenantUserId);

        boolean alreadyRead = announcementReceiptRepository.existsByAnnouncementIdAndUserId(announcementId, tenantUserId);
        if (!alreadyRead) {
            AnnouncementReceiptTbl receipt = AnnouncementReceiptTbl.builder()
                    .announcement(announcement)
                    .user(user)
                    .build();
            announcementReceiptRepository.save(receipt);
        }
    }

    private List<String> getRecipientUserIds(UUID propertyId, AnnouncementTargetType targetType, String targetValue) {
        List<String> recipientUserIds = new ArrayList<>();

        if (targetType == AnnouncementTargetType.PROPERTY) {
            List<LeaseTbl> activeLeases = leaseService.findActiveLeasesByProperty(propertyId);
            for (LeaseTbl lease : activeLeases) {
                if (lease.getUserId() != null) {
                    recipientUserIds.add(lease.getUserId().toString());
                }
            }
        } else if (targetType == AnnouncementTargetType.FLOOR) {
            if (targetValue != null) {
                try {
                    Integer floorNumber = Integer.valueOf(targetValue);
                    List<UnitTbl> unitsOnFloor = unitService.getUnitsByFloor(propertyId, floorNumber);
                    List<UUID> unitIds = unitsOnFloor.stream().map(BaseEntity::getId).collect(Collectors.toList());
                    if (!unitIds.isEmpty()) {
                        leaseService.findActiveLeasesByUnitIds(unitIds).values().stream()
                                .flatMap(List::stream)
                                .forEach(lease -> {
                                    if (lease.getUserId() != null) {
                                        recipientUserIds.add(lease.getUserId().toString());
                                    }
                                });
                    }
                } catch (NumberFormatException ignored) {}
            }
        } else if (targetType == AnnouncementTargetType.UNIT) {
            if (targetValue != null) {
                try {
                    UUID unitId = UUID.fromString(targetValue);
                    List<LeaseTbl> activeLeases = leaseService.findByUnitIdAndStatus(unitId, LeaseStatus.ACTIVE);
                    for (LeaseTbl lease : activeLeases) {
                        if (lease.getUserId() != null) {
                            recipientUserIds.add(lease.getUserId().toString());
                        }
                    }
                } catch (IllegalArgumentException ignored) {}
            }
        }

        return recipientUserIds.stream().distinct().collect(Collectors.toList());
    }

    private AnnouncementResponse mapToResponse(AnnouncementTbl announcement, boolean read, Long readCount, Long totalRecipientsCount) {
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
