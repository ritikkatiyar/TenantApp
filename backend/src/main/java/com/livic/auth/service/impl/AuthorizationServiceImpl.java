package com.livic.auth.service.impl;

import com.livic.auth.principal.UserDetailsImpl;
import com.livic.auth.service.interfaces.AuthorizationService;
import com.livic.auth.service.interfaces.MembershipCrudService;
import com.livic.finance.dto.ChargeConfigDTOs;
import com.livic.finance.dto.LeaseSummaryDTO;
import com.livic.finance.facade.FinanceFacade;
import com.livic.property.dto.UnitSummaryDTO;
import com.livic.property.facade.UnitFacade;

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
        if (currentUser.hasGlobalRole("SUPER_ADMIN") || currentUser.hasGlobalRole("ADMIN")) return true;

        UUID userId = UUID.fromString(currentUser.getId());
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
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) return false;
        if (currentUser.hasGlobalRole("SUPER_ADMIN") || currentUser.hasGlobalRole("ADMIN")) return true;

        UUID userId = UUID.fromString(currentUser.getId());
        boolean hasRole = membershipCrudService.existsByUserIdAndPropertyIdAndRoleCode(userId, propertyId, roleCode);
        log.debug("User {} role check for {} on property {}: {}", userId, roleCode, propertyId, hasRole);
        return hasRole;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasAnyRole(UUID propertyId, String... roleCodes) {
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) return false;
        if (currentUser.hasGlobalRole("SUPER_ADMIN") || currentUser.hasGlobalRole("ADMIN")) return true;

        UUID userId = UUID.fromString(currentUser.getId());
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
            return false;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermissionByLeaseId(UUID leaseId, String permissionCode) {
        if (leaseId == null) return false;
        
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) return false;
        UUID userId = UUID.fromString(currentUser.getId());
        
        try {
            return financeFacade.getLeaseById(leaseId).map(lease -> {
                if ("LEASE_VIEW_OWN".equals(permissionCode) && lease.userId() != null && lease.userId().toString().equals(currentUser.getId())) {
                    log.debug("User {} has own lease access for lease {}", userId, leaseId);
                    return true;
                }
                return checkPermission(lease.propertyId(), permissionCode);
            }).orElse(false);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermissionByRentCycleId(UUID rentCycleId, String permissionCode) {
        if (rentCycleId == null) return false;
        return financeFacade.getPropertyIdByRentCycleId(rentCycleId)
                .map(propertyId -> checkPermission(propertyId, permissionCode))
                .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermissionByChargeConfigId(UUID chargeConfigId, String permissionCode) {
        if (chargeConfigId == null) return false;
        try {
            ChargeConfigDTOs.ChargeConfigResponse c = financeFacade.getChargeConfigById(chargeConfigId);
            return checkPermission(c.getPropertyId(), permissionCode);
        } catch (Exception e) {
            return false;
        }
    }

    private boolean checkPermission(UUID propertyId, String permissionCode) {
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) {
            return false;
        }
        if (currentUser.hasGlobalRole("SUPER_ADMIN") || currentUser.hasGlobalRole("ADMIN")) {
            return true;
        }

        UUID userId = UUID.fromString(currentUser.getId());
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
