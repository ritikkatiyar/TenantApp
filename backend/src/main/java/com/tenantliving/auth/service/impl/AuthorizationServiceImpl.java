package com.tenantliving.auth.service.impl;

import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.auth.repository.MembershipRepository;
import com.tenantliving.auth.service.interfaces.AuthorizationService;
import com.tenantliving.finance.repository.ChargeConfigRepository;
import com.tenantliving.finance.repository.ExpenseGroupRepository;
import com.tenantliving.finance.repository.ExpenseRepository;
import com.tenantliving.finance.repository.ExpenseSplitRepository;
import com.tenantliving.finance.repository.LeaseRepository;
import com.tenantliving.finance.repository.RentCycleRepository;
import com.tenantliving.property.repository.UnitRepository;
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

    private final MembershipRepository membershipRepository;
    private final UnitRepository unitRepository;
    private final LeaseRepository leaseRepository;
    private final ExpenseGroupRepository expenseGroupRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository expenseSplitRepository;
    private final RentCycleRepository rentCycleRepository;
    private final ChargeConfigRepository chargeConfigRepository;

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

        UUID userId = UUID.fromString(currentUser.getId());
        Set<String> userPermissions = membershipRepository.findPermissionCodesByUserIdAndPropertyId(userId, propertyId);
        
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

        UUID userId = UUID.fromString(currentUser.getId());
        boolean hasRole = membershipRepository.existsByUserIdAndPropertyIdAndRoleCode(userId, propertyId, roleCode);
        log.debug("User {} role check for {} on property {}: {}", userId, roleCode, propertyId, hasRole);
        return hasRole;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasAnyRole(UUID propertyId, String... roleCodes) {
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) return false;

        UUID userId = UUID.fromString(currentUser.getId());
        for (String roleCode : roleCodes) {
            if (membershipRepository.existsByUserIdAndPropertyIdAndRoleCode(userId, propertyId, roleCode)) {
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
        return unitRepository.findById(unitId)
                .map(u -> checkPermission(u.getProperty().getId(), permissionCode))
                .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermissionByLeaseId(UUID leaseId, String permissionCode) {
        if (leaseId == null) return false;
        
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) return false;
        UUID userId = UUID.fromString(currentUser.getId());
        
        return leaseRepository.findById(leaseId).map(lease -> {
            // Special case for LEASE_VIEW_OWN
            if ("LEASE_VIEW_OWN".equals(permissionCode) && lease.getUserId().toString().equals(currentUser.getId())) {
                log.debug("User {} has own lease access for lease {}", userId, leaseId);
                return true;
            }
            return checkPermission(lease.getUnit().getProperty().getId(), permissionCode);
        }).orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermissionByExpenseGroupId(UUID groupId, String permissionCode) {
        if (groupId == null) return false;
        return expenseGroupRepository.findById(groupId)
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
        
        return expenseSplitRepository.findById(splitId).map(split -> {
            // Special case for own-split settle
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
        return expenseRepository.findById(expenseId)
                .map(e -> checkPermission(e.getExpenseGroup().getUnit().getProperty().getId(), permissionCode))
                .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermissionByRentCycleId(UUID rentCycleId, String permissionCode) {
        if (rentCycleId == null) return false;
        return rentCycleRepository.findById(rentCycleId)
                .map(r -> checkPermission(r.getLease().getUnit().getProperty().getId(), permissionCode))
                .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermissionByChargeConfigId(UUID chargeConfigId, String permissionCode) {
        if (chargeConfigId == null) return false;
        return chargeConfigRepository.findById(chargeConfigId)
                .map(c -> checkPermission(c.getProperty().getId(), permissionCode))
                .orElse(false);
    }

    private boolean checkPermission(UUID propertyId, String permissionCode) {
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) {
            return false;
        }

        UUID userId = UUID.fromString(currentUser.getId());
        Set<String> permissions = membershipRepository.findPermissionCodesByUserIdAndPropertyId(userId, propertyId);
        
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
