package com.livic.auth.service.impl;

import com.livic.auth.principal.UserDetailsImpl;
import com.livic.auth.service.interfaces.AuthorizationService;
import com.livic.auth.service.interfaces.MembershipCrudService;
import com.livic.finance.service.interfaces.ExpenseGroupCrudService;
import com.livic.finance.service.interfaces.ExpenseCrudService;
import com.livic.finance.service.interfaces.ExpenseSplitCrudService;
import com.livic.finance.service.interfaces.LeaseQueryService;
import com.livic.finance.service.interfaces.RentCycleCrudService;
import com.livic.finance.service.ChargeConfigQueryService;
import com.livic.property.service.interfaces.UnitQueryService;
import com.livic.property.domain.UnitTbl;
import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.dto.ChargeConfigDTOs;

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
    private final UnitQueryService unitQueryService;
    private final LeaseQueryService leaseQueryService;
    private final ExpenseGroupCrudService expenseGroupCrudService;
    private final ExpenseCrudService expenseCrudService;
    private final ExpenseSplitCrudService expenseSplitCrudService;
    private final RentCycleCrudService rentCycleCrudService;
    private final ChargeConfigQueryService chargeConfigQueryService;

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
            UnitTbl u = unitQueryService.getUnitById(unitId);
            return checkPermission(u.getProperty().getId(), permissionCode);
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
            LeaseTbl lease = leaseQueryService.getLeaseById(leaseId);
            if ("LEASE_VIEW_OWN".equals(permissionCode) && lease.getUserId().toString().equals(currentUser.getId())) {
                log.debug("User {} has own lease access for lease {}", userId, leaseId);
                return true;
            }
            return checkPermission(lease.getUnit().getProperty().getId(), permissionCode);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermissionByExpenseGroupId(UUID groupId, String permissionCode) {
        if (groupId == null) return false;
        return expenseGroupCrudService.findById(groupId)
                .map(g -> checkPermission(g.getUnit().getProperty().getId(), permissionCode))
                .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermissionByExpenseSplitId(UUID splitId, String permissionCode) {
        if (splitId == null) return false;
        
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) return false;
        UUID userId = UUID.fromString(currentUser.getId());
        
        return expenseSplitCrudService.findById(splitId).map(split -> {
            if (split.getUserId().toString().equals(currentUser.getId())) {
                log.debug("User {} has own expense split access for split {}", userId, splitId);
                return true;
            }
            return checkPermission(split.getExpense().getExpenseGroup().getUnit().getProperty().getId(), permissionCode);
        }).orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermissionByExpenseId(UUID expenseId, String permissionCode) {
        if (expenseId == null) return false;
        return expenseCrudService.findById(expenseId)
                .map(e -> checkPermission(e.getExpenseGroup().getUnit().getProperty().getId(), permissionCode))
                .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermissionByRentCycleId(UUID rentCycleId, String permissionCode) {
        if (rentCycleId == null) return false;
        return rentCycleCrudService.findById(rentCycleId)
                .map(r -> checkPermission(r.getLease().getUnit().getProperty().getId(), permissionCode))
                .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermissionByChargeConfigId(UUID chargeConfigId, String permissionCode) {
        if (chargeConfigId == null) return false;
        try {
            ChargeConfigDTOs.ChargeConfigResponse c = chargeConfigQueryService.getChargeConfigById(chargeConfigId);
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
