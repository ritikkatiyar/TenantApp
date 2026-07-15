package com.tenantliving.announcement.service;

import com.tenantliving.announcement.domain.*;
import com.tenantliving.announcement.dto.AnnouncementDTOs.CreateAnnouncementRequest;
import com.tenantliving.announcement.dto.AnnouncementDTOs.AnnouncementResponse;
import com.tenantliving.announcement.service.interfaces.AnnouncementService;
import com.tenantliving.common.domain.LeaseStatus;
import com.tenantliving.common.domain.BaseEntity;
import com.tenantliving.common.event.AnnouncementBroadcastEvent;
import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.service.interfaces.LeaseQueryService;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.domain.UnitTbl;
import com.tenantliving.property.service.interfaces.PropertyQueryService;
import com.tenantliving.property.service.interfaces.UnitQueryService;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserQueryService;
import com.tenantliving.announcement.service.interfaces.AnnouncementCrudService;
import com.tenantliving.announcement.service.interfaces.AnnouncementReceiptCrudService;
import com.tenantliving.finance.service.interfaces.LeaseCrudService;
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
    private final PropertyQueryService propertyQueryService;
    private final UserQueryService userQueryService;
    private final LeaseCrudService leaseCrudService;
    private final LeaseQueryService leaseQueryService;
    private final UnitQueryService unitQueryService;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    @Transactional
    public AnnouncementResponse createAnnouncement(CreateAnnouncementRequest request, UUID creatorId) {
        PropertyTbl property = propertyQueryService.getPropertyById(request.getPropertyId());
        UserTbl creator = userQueryService.getUserById(creatorId);

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
        LeaseTbl activeLease = leaseCrudService.findByUserIdAndStatus(tenantUserId, LeaseStatus.ACTIVE)
                .orElse(null);

        if (activeLease == null || activeLease.getUnit() == null || activeLease.getUnit().getProperty() == null) {
            return Page.empty(pageable);
        }

        UUID propertyId = activeLease.getUnit().getProperty().getId();
        String floorStr = String.valueOf(activeLease.getUnit().getFloor());
        String unitIdStr = activeLease.getUnit().getId().toString();

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
        List<LeaseTbl> allActivePropertyLeases = leaseCrudService.findActiveOccupanciesByProperty(propertyId, LeaseStatus.ACTIVE);
        Map<UUID, List<LeaseTbl>> leasesByUnit = allActivePropertyLeases.stream()
                .collect(Collectors.groupingBy(l -> l.getUnit().getId()));
        Map<Integer, List<LeaseTbl>> leasesByFloor = allActivePropertyLeases.stream()
                .collect(Collectors.groupingBy(l -> l.getUnit().getFloor()));

        return announcements.map(announcement -> {
            long readCount = readCountsMap.getOrDefault(announcement.getId(), 0L);
            List<String> recipients = getRecipientUserIdsOptimized(
                    announcement.getTargetType(), announcement.getTargetValue(), allActivePropertyLeases, leasesByUnit, leasesByFloor);
            long totalRecipients = recipients.size();

            return mapToResponse(announcement, false, readCount, totalRecipients);
        });
    }

    private List<String> getRecipientUserIdsOptimized(AnnouncementTargetType targetType, String targetValue, 
                                                      List<LeaseTbl> allActivePropertyLeases, 
                                                      Map<UUID, List<LeaseTbl>> leasesByUnit, 
                                                      Map<Integer, List<LeaseTbl>> leasesByFloor) {
        List<String> recipientUserIds = new ArrayList<>();
        if (targetType == AnnouncementTargetType.PROPERTY) {
            for (LeaseTbl lease : allActivePropertyLeases) {
                if (lease.getUserId() != null) {
                    recipientUserIds.add(lease.getUserId().toString());
                }
            }
        } else if (targetType == AnnouncementTargetType.FLOOR) {
            if (targetValue != null) {
                try {
                    Integer floorNumber = Integer.valueOf(targetValue);
                    List<LeaseTbl> floorLeases = leasesByFloor.getOrDefault(floorNumber, List.of());
                    for (LeaseTbl lease : floorLeases) {
                        if (lease.getUserId() != null) {
                            recipientUserIds.add(lease.getUserId().toString());
                        }
                    }
                } catch (NumberFormatException ignored) {}
            }
        } else if (targetType == AnnouncementTargetType.UNIT) {
            if (targetValue != null) {
                try {
                    UUID unitId = UUID.fromString(targetValue);
                    List<LeaseTbl> unitLeases = leasesByUnit.getOrDefault(unitId, List.of());
                    for (LeaseTbl lease : unitLeases) {
                        if (lease.getUserId() != null) {
                            recipientUserIds.add(lease.getUserId().toString());
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

        UserTbl user = userQueryService.getUserById(tenantUserId);

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
            List<LeaseTbl> activeLeases = leaseQueryService.findActiveLeasesByProperty(propertyId);
            for (LeaseTbl lease : activeLeases) {
                if (lease.getUserId() != null) {
                    recipientUserIds.add(lease.getUserId().toString());
                }
            }
        } else if (targetType == AnnouncementTargetType.FLOOR) {
            if (targetValue != null) {
                try {
                    Integer floorNumber = Integer.valueOf(targetValue);
                    List<UnitTbl> unitsOnFloor = unitQueryService.getUnitsByFloor(propertyId, floorNumber);
                    List<UUID> unitIds = unitsOnFloor.stream().map(BaseEntity::getId).collect(Collectors.toList());
                    if (!unitIds.isEmpty()) {
                        leaseQueryService.findActiveLeasesByUnitIds(unitIds).values().stream()
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
                    List<LeaseTbl> activeLeases = leaseQueryService.findByUnitIdAndStatus(unitId, LeaseStatus.ACTIVE);
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
