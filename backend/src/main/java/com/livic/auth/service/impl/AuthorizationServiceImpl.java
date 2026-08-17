package com.livic.auth.service.impl;

import com.livic.auth.principal.UserDetailsImpl;
import com.livic.auth.service.interfaces.AuthorizationService;

import com.livic.auth.service.interfaces.MembershipCrudService;
import com.livic.finance.facade.FinanceFacade;
import com.livic.inventory.facade.InventoryFacade;
import com.livic.property.dto.UnitSummaryDTO;
import com.livic.property.facade.UnitFacade;
import com.livic.common.domain.OwnerModule;
import com.livic.storage.facade.StorageFacade;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public boolean hasRole(UUID propertyId, String roleCode) {
        return hasAnyRole(propertyId, roleCode);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasAnyRole(UUID propertyId, String... roleCodes) {
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) return false;
        if (isUserGloballyAuthorized(currentUser)) return true;

        UUID userId = currentUser.getUuid();
        
        for (String roleCode : roleCodes) {
            if (membershipCrudService.existsByUserIdAndPropertyIdAndRoleCode(userId, propertyId, roleCode)) {
                log.debug("User {} has role {} on property {}", userId, roleCode, propertyId);
                return true;
            }
        }
        
        log.debug("User {} does not have any of {} on property {}", userId, roleCodes, propertyId);
        return false;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermissionByUnitId(UUID unitId, String permissionCode) {
        if (unitId == null) return false;
        try {
            UnitSummaryDTO u = unitFacade.getUnitById(unitId).orElse(null);
            return u != null && checkPermission(u.propertyId(), permissionCode);
        } catch (Exception e) {
            log.error("Error checking permission for unitId {}: {}", unitId, e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermissionByLeaseId(UUID leaseId, String permissionCode) {
        if (leaseId == null) return false;
        
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) return false;
        UUID userId = currentUser.getUuid();
        
        try {
            return financeFacade.getLeaseById(leaseId).map(lease -> {
                if ("LEASE_VIEW_OWN".equals(permissionCode) && lease.userId() != null && lease.userId().equals(userId)) {
                    log.debug("User {} has own lease access for lease {}", userId, leaseId);
                    return true;
                }
                return checkPermission(lease.propertyId(), permissionCode);
            }).orElse(false);
        } catch (Exception e) {
            log.error("Error checking permission for leaseId {}: {}", leaseId, e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermissionByAssignmentId(UUID assignmentId, String permissionCode) {
        if (assignmentId == null) return false;
        try {
            return inventoryFacade.getLeaseIdForAssignment(assignmentId)
                    .map(leaseId -> hasPermissionByLeaseId(leaseId, permissionCode))
                    .orElse(false);
        } catch (Exception e) {
            log.error("Error checking permission for assignmentId {}: {}", assignmentId, e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermissionByItemId(UUID itemId, String permissionCode) {
        if (itemId == null) return false;
        try {
            return inventoryFacade.getPropertyIdForInventoryItem(itemId)
                    .map(propertyId -> checkPermission(propertyId, permissionCode))
                    .orElse(false);
        } catch (Exception e) {
            log.error("Error checking permission for itemId {}: {}", itemId, e.getMessage(), e);
            return false;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermissionByRentCycleId(UUID rentCycleId, String permissionCode) {
        if (rentCycleId == null) return false;
        try {
            return financeFacade.getPropertyIdByRentCycleId(rentCycleId)
                    .map(propertyId -> checkPermission(propertyId, permissionCode))
                    .orElse(false);
        } catch (Exception e) {
            log.error("Error checking permission for rentCycleId {}: {}", rentCycleId, e.getMessage(), e);
            return false;
        }
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
            case LEASE -> isWrite ? hasPermissionByLeaseId(referenceId, "LEASE_UPDATE")
                    : (hasPermissionByLeaseId(referenceId, "LEASE_VIEW") || hasPermissionByLeaseId(referenceId, "LEASE_VIEW_OWN"));
            case INVENTORY -> isWrite ? hasPermissionByItemId(referenceId, "PROPERTY_EDIT") : hasPermissionByItemId(referenceId, "PROPERTY_VIEW");
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

    private boolean isUserGloballyAuthorized(UserDetailsImpl currentUser) {
        return currentUser != null && (currentUser.hasGlobalRole("SUPER_ADMIN") || currentUser.hasGlobalRole("ADMIN"));
    }

    private boolean checkPermission(UUID propertyId, String permissionCode) {
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) {
            return false;
        }
        if (isUserGloballyAuthorized(currentUser)) {
            return true;
        }

        UUID userId = currentUser.getUuid();
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

