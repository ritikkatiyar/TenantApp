package com.livic.announcement.service;

import com.livic.announcement.domain.*;
import com.livic.announcement.dto.AnnouncementDTOs.CreateAnnouncementRequest;
import com.livic.announcement.dto.AnnouncementDTOs.AnnouncementResponse;
import com.livic.announcement.service.interfaces.AnnouncementService;
import com.livic.common.domain.BaseEntity;
import com.livic.common.event.AnnouncementBroadcastEvent;
import com.livic.finance.dto.LeaseSummaryDTO;
import com.livic.finance.facade.FinanceFacade;
import com.livic.property.domain.PropertyTbl;
import com.livic.property.dto.PropertySummaryDTO;
import com.livic.property.facade.PropertyFacade;
import com.livic.user.domain.UserTbl;
import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;
import com.livic.announcement.service.interfaces.AnnouncementCrudService;
import com.livic.announcement.service.interfaces.AnnouncementReceiptCrudService;
import com.livic.common.exception.BusinessException;
import org.springframework.http.HttpStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.ApplicationEventPublisher;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnnouncementServiceImpl implements AnnouncementService {

    private final AnnouncementCrudService announcementCrudService;
    private final AnnouncementReceiptCrudService announcementReceiptCrudService;
    private final PropertyFacade propertyFacade;
    private final UserFacade userFacade;
    private final FinanceFacade financeFacade;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public AnnouncementResponse createAnnouncement(CreateAnnouncementRequest request, UUID creatorId) {
        PropertySummaryDTO propSummary = propertyFacade.getPropertyById(request.getPropertyId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Property not found"));
        UserSummaryDTO userSummary = userFacade.getUserById(creatorId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));

        PropertyTbl property = new PropertyTbl();
        property.setId(propSummary.id());
        UserTbl creator = new UserTbl();
        creator.setId(userSummary.id());

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

        announcement = announcementCrudService.save(announcement);

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
    public Page<AnnouncementResponse> getNoticesForTenant(UUID tenantUserId, Pageable pageable) {
        LeaseSummaryDTO activeLease = financeFacade.getActiveLeaseForUser(tenantUserId).orElse(null);

        if (activeLease == null || activeLease.propertyId() == null) {
            return Page.empty(pageable);
        }

        UUID propertyId = activeLease.propertyId();
        String floorStr = activeLease.floor() != null ? String.valueOf(activeLease.floor()) : "0";
        String unitIdStr = activeLease.unitId() != null ? activeLease.unitId().toString() : "";

        Page<AnnouncementTbl> announcements = announcementCrudService.findNoticesForTenant(propertyId, floorStr, unitIdStr, pageable);

        // Fetch receipts in bulk for the current page's announcements to avoid N+1 queries in loop
        List<UUID> announcementIds = announcements.getContent().stream().map(AnnouncementTbl::getId).toList();
        
        Set<UUID> readAnnouncementIds = new HashSet<>();
        if (!announcementIds.isEmpty()) {
            readAnnouncementIds = announcementReceiptCrudService.findByUserIdAndAnnouncementIdIn(tenantUserId, announcementIds)
                    .stream()
                    .map(r -> r.getAnnouncement().getId())
                    .collect(Collectors.toSet());
        }

        final Set<UUID> finalReadAnnouncementIds = readAnnouncementIds;

        return announcements.map(announcement -> {
            boolean isRead = finalReadAnnouncementIds.contains(announcement.getId());
            return mapToResponse(announcement, isRead, null, null);
        });
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AnnouncementResponse> getAnnouncementsForProperty(UUID propertyId, UUID userWithAccessId, Pageable pageable) {
        Page<AnnouncementTbl> announcements = announcementCrudService.findByPropertyId(propertyId, pageable);

        List<UUID> announcementIds = announcements.getContent().stream().map(AnnouncementTbl::getId).toList();

        // Optimized: Fetch read counts in bulk for these announcements
        Map<UUID, Long> readCountsMap = new HashMap<>();
        if (!announcementIds.isEmpty()) {
            List<Object[]> countResults = announcementReceiptCrudService.countReceiptsByAnnouncementIdIn(announcementIds);
            for (Object[] row : countResults) {
                readCountsMap.put((UUID) row[0], (Long) row[1]);
            }
        }

        // Optimized: Fetch all active property leases once to group in memory instead of executing DB queries in loop
        List<LeaseSummaryDTO> allActivePropertyLeases = financeFacade.getActiveLeasesByPropertyId(propertyId);
        Map<UUID, List<LeaseSummaryDTO>> leasesByUnit = allActivePropertyLeases.stream()
                .filter(l -> l.unitId() != null)
                .collect(Collectors.groupingBy(LeaseSummaryDTO::unitId));
        Map<Integer, List<LeaseSummaryDTO>> leasesByFloor = allActivePropertyLeases.stream()
                .filter(l -> l.floor() != null)
                .collect(Collectors.groupingBy(LeaseSummaryDTO::floor));

        return announcements.map(announcement -> {
            long readCount = readCountsMap.getOrDefault(announcement.getId(), 0L);
            List<String> recipients = getRecipientUserIdsOptimized(
                    announcement.getTargetType(), announcement.getTargetValue(), allActivePropertyLeases, leasesByUnit, leasesByFloor);
            long totalRecipients = recipients.size();

            return mapToResponse(announcement, false, readCount, totalRecipients);
        });
    }

    private List<String> getRecipientUserIdsOptimized(AnnouncementTargetType targetType, String targetValue, 
                                                      List<LeaseSummaryDTO> allActivePropertyLeases, 
                                                      Map<UUID, List<LeaseSummaryDTO>> leasesByUnit, 
                                                      Map<Integer, List<LeaseSummaryDTO>> leasesByFloor) {
        List<String> recipientUserIds = new ArrayList<>();
        if (targetType == AnnouncementTargetType.PROPERTY) {
            for (LeaseSummaryDTO lease : allActivePropertyLeases) {
                if (lease.userId() != null) {
                    recipientUserIds.add(lease.userId().toString());
                }
            }
        } else if (targetType == AnnouncementTargetType.FLOOR) {
            if (targetValue != null) {
                try {
                    Integer floorNumber = Integer.valueOf(targetValue);
                    List<LeaseSummaryDTO> floorLeases = leasesByFloor.getOrDefault(floorNumber, List.of());
                    for (LeaseSummaryDTO lease : floorLeases) {
                        if (lease.userId() != null) {
                            recipientUserIds.add(lease.userId().toString());
                        }
                    }
                } catch (NumberFormatException ignored) {}
            }
        } else if (targetType == AnnouncementTargetType.UNIT) {
            if (targetValue != null) {
                try {
                    UUID unitId = UUID.fromString(targetValue);
                    List<LeaseSummaryDTO> unitLeases = leasesByUnit.getOrDefault(unitId, List.of());
                    for (LeaseSummaryDTO lease : unitLeases) {
                        if (lease.userId() != null) {
                            recipientUserIds.add(lease.userId().toString());
                        }
                    }
                } catch (IllegalArgumentException ignored) {}
            }
        }
        return recipientUserIds.stream().distinct().collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void markAsRead(UUID announcementId, UUID tenantUserId) {
        AnnouncementTbl announcement = announcementCrudService.findById(announcementId)
                .orElseThrow(() -> new IllegalArgumentException("Announcement not found with ID: " + announcementId));

        UserSummaryDTO userSummary = userFacade.getUserById(tenantUserId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "User not found"));
        UserTbl user = new UserTbl();
        user.setId(userSummary.id());

        boolean alreadyRead = announcementReceiptCrudService.existsByAnnouncementIdAndUserId(announcementId, tenantUserId);
        if (!alreadyRead) {
            AnnouncementReceiptTbl receipt = AnnouncementReceiptTbl.builder()
                    .announcement(announcement)
                    .user(user)
                    .build();
            announcementReceiptCrudService.save(receipt);
        }
    }

    private List<String> getRecipientUserIds(UUID propertyId, AnnouncementTargetType targetType, String targetValue) {
        List<String> recipientUserIds = new ArrayList<>();

        if (targetType == AnnouncementTargetType.PROPERTY) {
            List<LeaseSummaryDTO> activeLeases = financeFacade.getActiveLeasesByPropertyId(propertyId);
            for (LeaseSummaryDTO lease : activeLeases) {
                if (lease.userId() != null) {
                    recipientUserIds.add(lease.userId().toString());
                }
            }
        } else if (targetType == AnnouncementTargetType.FLOOR) {
            if (targetValue != null) {
                try {
                    Integer floorNumber = Integer.valueOf(targetValue);
                    List<com.livic.property.dto.UnitSummaryDTO> unitsOnFloor = propertyFacade.getUnitsByPropertyId(propertyId).stream()
                            .filter(u -> u.floor() != null && u.floor().equals(floorNumber))
                            .toList();
                    List<UUID> unitIds = unitsOnFloor.stream().map(com.livic.property.dto.UnitSummaryDTO::id).collect(Collectors.toList());
                    if (!unitIds.isEmpty()) {
                        financeFacade.getActiveLeasesByUnitIds(unitIds).values().stream()
                                  .flatMap(List::stream)
                                  .forEach(lease -> {
                                      if (lease.userId() != null) {
                                          recipientUserIds.add(lease.userId().toString());
                                      }
                                  });
                    }
                } catch (NumberFormatException ignored) {}
            }
        } else if (targetType == AnnouncementTargetType.UNIT) {
            if (targetValue != null) {
                try {
                    UUID unitId = UUID.fromString(targetValue);
                    List<LeaseSummaryDTO> activeLeases = financeFacade.getActiveLeasesByUnitId(unitId);
                    for (LeaseSummaryDTO lease : activeLeases) {
                        if (lease.userId() != null) {
                            recipientUserIds.add(lease.userId().toString());
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
