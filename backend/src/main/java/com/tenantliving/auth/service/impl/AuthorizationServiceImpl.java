package com.tenantliving.auth.service.impl;

import com.tenantliving.auth.domain.MembershipTbl;
import com.tenantliving.auth.domain.RolePermissionTbl;
import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.auth.repository.MembershipRepository;
import com.tenantliving.auth.repository.RolePermissionRepository;
import com.tenantliving.auth.service.interfaces.AuthorizationService;

import com.tenantliving.finance.repository.ChargeConfigRepository;
import com.tenantliving.finance.repository.ExpenseGroupRepository;
import com.tenantliving.finance.repository.ExpenseRepository;
import com.tenantliving.finance.repository.ExpenseSplitRepository;
import com.tenantliving.finance.repository.LeaseRepository;
import com.tenantliving.finance.repository.RentCycleRepository;
import com.tenantliving.property.repository.UnitRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service("authorizationService")
@RequiredArgsConstructor
public class AuthorizationServiceImpl implements AuthorizationService {

    private final MembershipRepository membershipRepository;
    private final RolePermissionRepository rolePermissionRepository;
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
        if (currentUser.hasGlobalRole("SUPER_ADMIN")) return true;

        UUID userId = UUID.fromString(currentUser.getId());
        Optional<MembershipTbl> membershipOpt = membershipRepository.findByUserIdAndPropertyId(userId, propertyId);
        if (membershipOpt.isEmpty()) return false;

        List<RolePermissionTbl> rolePermissions = rolePermissionRepository.findByRoleId(membershipOpt.get().getRole().getId());
        
        for (String code : permissionCodes) {
            if (rolePermissions.stream().anyMatch(rp -> rp.getPermission().getCode().equals(code))) {
                return true;
            }
        }
        return false;
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasRole(UUID propertyId, String roleCode) {
        return checkRole(propertyId, roleCode);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasAnyRole(UUID propertyId, String... roleCodes) {
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) return false;
        if (currentUser.hasGlobalRole("SUPER_ADMIN")) return true;

        UUID userId = UUID.fromString(currentUser.getId());
        Optional<MembershipTbl> membershipOpt = membershipRepository.findByUserIdAndPropertyId(userId, propertyId);
        if (membershipOpt.isEmpty()) return false;

        String actualRole = membershipOpt.get().getRole().getCode();
        for (String code : roleCodes) {
            if (actualRole.equals(code)) {
                return true;
            }
        }
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
        return leaseRepository.findById(leaseId)
                .map(l -> checkPermission(l.getUnit().getProperty().getId(), permissionCode))
                .orElse(false);
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
        return expenseSplitRepository.findById(splitId)
                .map(s -> checkPermission(s.getExpense().getExpenseGroup().getUnit().getProperty().getId(), permissionCode))
                .orElse(false);
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
        
        // Super Admins have all permissions implicitly
        boolean isSuperAdmin = currentUser.hasGlobalRole("SUPER_ADMIN");
        if (isSuperAdmin) {
            return true;
        }

        UUID userId = UUID.fromString(currentUser.getId());
        Optional<MembershipTbl> membershipOpt = membershipRepository.findByUserIdAndPropertyId(userId, propertyId);
        
        if (membershipOpt.isEmpty()) {
            return false;
        }
        
        MembershipTbl membership = membershipOpt.get();
        List<RolePermissionTbl> rolePermissions = rolePermissionRepository.findByRoleId(membership.getRole().getId());
        
        return rolePermissions.stream()
                .anyMatch(rp -> rp.getPermission().getCode().equals(permissionCode));
    }
    
    private boolean checkRole(UUID propertyId, String roleCode) {
        UserDetailsImpl currentUser = getCurrentUser();
        if (currentUser == null) {
            return false;
        }
        
        // Super Admins bypass property role checks
        boolean isSuperAdmin = currentUser.hasGlobalRole("SUPER_ADMIN");
        if (isSuperAdmin) {
            return true;
        }

        UUID userId = UUID.fromString(currentUser.getId());
        Optional<MembershipTbl> membershipOpt = membershipRepository.findByUserIdAndPropertyId(userId, propertyId);
        
        if (membershipOpt.isEmpty()) {
            return false;
        }
        
        return membershipOpt.get().getRole().getCode().equals(roleCode);
    }

    private UserDetailsImpl getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated() || authentication.getPrincipal().equals("anonymousUser")) {
            return null;
        }
        if (authentication.getPrincipal() instanceof UserDetailsImpl) {
            return (UserDetailsImpl) authentication.getPrincipal();
        }
        return null;
    }
}
