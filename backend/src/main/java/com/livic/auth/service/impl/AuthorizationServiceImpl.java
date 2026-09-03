package com.livic.auth.service.impl;

import com.livic.auth.principal.UserDetailsImpl;
import com.livic.auth.service.interfaces.AuthorizationService;
import com.livic.auth.service.interfaces.MembershipCrudService;
import com.livic.common.enums.AccessType;
import com.livic.common.enums.OwnerModule;
import com.livic.common.enums.ResourceType;
import com.livic.finance.dto.ChargeConfigResponse;
import com.livic.finance.dto.LeaseSummaryDTO;
import com.livic.finance.facade.FinanceFacade;
import com.livic.inventory.facade.InventoryFacade;
import com.livic.property.dto.UnitSummaryDTO;
import com.livic.property.facade.UnitFacade;
import com.livic.storage.facade.StorageFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service("authorizationService")
@RequiredArgsConstructor
public class AuthorizationServiceImpl implements AuthorizationService {

    private final MembershipCrudService membershipCrudService;
    private final UnitFacade unitFacade;
    private final FinanceFacade financeFacade;
    private final InventoryFacade inventoryFacade;
    private final StorageFacade storageFacade;

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermission(UUID propertyId, String permissionCode) {
        return checkPermission(propertyId, permissionCode);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasAnyPermission(UUID propertyId, String... permissionCodes) {
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) return false;
        if (isUserGloballyAuthorized(currentUser)) return true;

        if (hasFullAccess(propertyId)) {
            return true;
        }

        UUID userId = currentUser.getUuid();
        Set<String> userPermissions = membershipCrudService.findPermissionCodesByUserIdAndPropertyId(userId, propertyId);

        for (String code : permissionCodes) {
            if (userPermissions.contains(code)) {
                log.debug("User {} has permission {} on property {}", userId, code, propertyId);
                return true;
            }
        }

        log.debug("User {} does not have any of {} on property {}", userId, permissionCodes, propertyId);
        return false;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasFullAccess(UUID propertyId) {
        if (propertyId == null) return false;
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) return false;
        if (isUserGloballyAuthorized(currentUser)) return true;

        UUID userId = currentUser.getUuid();
        return membershipCrudService.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermission(ResourceType resourceType, UUID resourceId, String permissionCode) {
        if (resourceType == null || resourceId == null) {
            return false;
        }

        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) {
            return false;
        }
        if (isUserGloballyAuthorized(currentUser)) {
            return true;
        }

        UUID userId = currentUser.getUuid();

        try {
            return switch (resourceType) {
                case PROPERTY -> checkPermission(resourceId, permissionCode);
                case UNIT -> unitFacade.getUnitById(resourceId)
                        .map(UnitSummaryDTO::propertyId)
                        .map(propertyId -> checkPermission(propertyId, permissionCode))
                        .orElse(false);
                case LEASE -> financeFacade.getLeaseById(resourceId)
                        .map(lease -> {
                            if ("LEASE_VIEW_OWN".equals(permissionCode) && lease.userId() != null && lease.userId().equals(userId)) {
                                return true;
                            }
                            return checkPermission(lease.propertyId(), permissionCode);
                        })
                        .orElse(false);
                case RENT_CYCLE -> financeFacade.getPropertyIdByRentCycleId(resourceId)
                        .map(propertyId -> checkPermission(propertyId, permissionCode))
                        .orElse(false);
                case CHARGE_CONFIG -> {
                    ChargeConfigResponse chargeConfig = financeFacade.getChargeConfigById(resourceId);
                    yield chargeConfig != null && checkPermission(chargeConfig.getPropertyId(), permissionCode);
                }
                case INVENTORY_ITEM -> inventoryFacade.getPropertyIdForInventoryItem(resourceId)
                        .map(propertyId -> checkPermission(propertyId, permissionCode))
                        .orElse(false);
                case INVENTORY_ASSIGNMENT -> inventoryFacade.getLeaseIdForAssignment(resourceId)
                        .map(leaseId -> hasPermission(ResourceType.LEASE, leaseId, permissionCode))
                        .orElse(false);
                case MEDIA_ASSET -> hasMediaAssetAccess(resourceId, permissionCode);
            };
        } catch (Exception e) {
            log.error("Error evaluating permission {} on resource {} ({}): {}", permissionCode, resourceType, resourceId, e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasAnyPermission(ResourceType resourceType, UUID resourceId, String... permissionCodes) {
        if (permissionCodes == null) return false;
        for (String permissionCode : permissionCodes) {
            if (hasPermission(resourceType, resourceId, permissionCode)) {
                return true;
            }
        }
        return false;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasFullAccess(ResourceType resourceType, UUID resourceId) {
        if (resourceType == null || resourceId == null) return false;
        Optional<UUID> propertyIdOpt = resolvePropertyId(resourceType, resourceId);
        return propertyIdOpt.map(this::hasFullAccess).orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasMediaAccess(OwnerModule ownerModule, UUID referenceId, String action) {
        if (ownerModule == null || referenceId == null) {
            return false;
        }
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) return false;
        if (isUserGloballyAuthorized(currentUser)) return true;

        boolean isWrite = "WRITE".equalsIgnoreCase(action) || "DELETE".equalsIgnoreCase(action) || "EDIT".equalsIgnoreCase(action);

        return switch (ownerModule) {
            case PROPERTY -> isWrite ? checkPermission(referenceId, "PROPERTY_EDIT") : checkPermission(referenceId, "PROPERTY_VIEW");
            case LEASE -> isWrite ? hasPermission(ResourceType.LEASE, referenceId, "LEASE_UPDATE")
                    : (hasPermission(ResourceType.LEASE, referenceId, "LEASE_VIEW") || hasPermission(ResourceType.LEASE, referenceId, "LEASE_VIEW_OWN"));
            case INVENTORY -> isWrite ? hasPermission(ResourceType.INVENTORY_ITEM, referenceId, "PROPERTY_EDIT") : hasPermission(ResourceType.INVENTORY_ITEM, referenceId, "PROPERTY_VIEW");
        };
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasMediaAssetAccess(UUID mediaAssetId, String action) {
        if (mediaAssetId == null) return false;
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) return false;
        if (isUserGloballyAuthorized(currentUser)) return true;

        UUID userId = currentUser.getUuid();
        try {
            return storageFacade.getAssetById(mediaAssetId).map(asset -> {
                if (asset.uploadedByUserId() != null && asset.uploadedByUserId().equals(userId)) {
                    return true;
                }
                return hasMediaAccess(asset.ownerModule(), asset.referenceId(), action);
            }).orElse(false);
        } catch (Exception e) {
            log.error("Error checking permission for mediaAssetId {}: {}", mediaAssetId, e.getMessage(), e);
            return false;
        }
    }

    private Optional<UUID> resolvePropertyId(ResourceType resourceType, UUID resourceId) {
        return switch (resourceType) {
            case PROPERTY -> Optional.of(resourceId);
            case UNIT -> unitFacade.getUnitById(resourceId).map(UnitSummaryDTO::propertyId);
            case LEASE -> financeFacade.getLeaseById(resourceId).map(LeaseSummaryDTO::propertyId);
            case RENT_CYCLE -> financeFacade.getPropertyIdByRentCycleId(resourceId);
            case CHARGE_CONFIG -> Optional.ofNullable(financeFacade.getChargeConfigById(resourceId)).map(ChargeConfigResponse::getPropertyId);
            case INVENTORY_ITEM -> inventoryFacade.getPropertyIdForInventoryItem(resourceId);
            case INVENTORY_ASSIGNMENT -> inventoryFacade.getLeaseIdForAssignment(resourceId)
                    .flatMap(leaseId -> financeFacade.getLeaseById(leaseId).map(LeaseSummaryDTO::propertyId));
            case MEDIA_ASSET -> storageFacade.getAssetById(resourceId)
                    .flatMap(asset -> resolvePropertyIdFromOwnerModule(asset.ownerModule(), asset.referenceId()));
        };
    }

    private Optional<UUID> resolvePropertyIdFromOwnerModule(OwnerModule ownerModule, UUID referenceId) {
        if (ownerModule == null || referenceId == null) return Optional.empty();
        return switch (ownerModule) {
            case PROPERTY -> Optional.of(referenceId);
            case LEASE -> financeFacade.getLeaseById(referenceId).map(LeaseSummaryDTO::propertyId);
            case INVENTORY -> inventoryFacade.getPropertyIdForInventoryItem(referenceId);
        };
    }

    private boolean isUserGloballyAuthorized(UserDetailsImpl currentUser) {
        return currentUser != null && (currentUser.hasGlobalRole("SUPER_ADMIN") || currentUser.hasGlobalRole("ADMIN"));
    }

    private boolean checkPermission(UUID propertyId, String permissionCode) {
        if (propertyId == null) {
            return false;
        }
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) {
            return false;
        }
        if (isUserGloballyAuthorized(currentUser)) {
            return true;
        }

        UUID userId = currentUser.getUuid();

        // 1. Full Access check: if the user holds any FULL_ACCESS role on this property, all permissions are granted
        if (membershipCrudService.existsByUserIdAndPropertyIdAndAccessType(userId, propertyId, AccessType.FULL_ACCESS)) {
            log.debug("User {} has FULL_ACCESS on property {}", userId, propertyId);
            return true;
        }

        // 2. Custom Access check: check explicit permission matrix
        Set<String> permissions = membershipCrudService.findPermissionCodesByUserIdAndPropertyId(userId, propertyId);
        boolean hasPerm = permissions.contains(permissionCode);
        log.debug("User {} permission check for {} on property {}: {}", userId, permissionCode, propertyId, hasPerm);

        return hasPerm;
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || "anonymousUser".equals(authentication.getPrincipal())) {
            return null;
        }
        if (authentication.getPrincipal() instanceof UserDetailsImpl) {
            return (UserDetailsImpl) authentication.getPrincipal();
        }
        return null;
    }
}
