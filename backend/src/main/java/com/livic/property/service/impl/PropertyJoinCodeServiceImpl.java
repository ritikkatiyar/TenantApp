package com.livic.property.service.impl;

import com.livic.property.domain.PropertyJoinCodeTbl;
import com.livic.property.domain.PropertyTbl;
import com.livic.property.service.interfaces.PropertyJoinCodeCrudService;
import com.livic.property.service.interfaces.PropertyJoinCodeService;
import com.livic.property.service.interfaces.PropertyQueryService;
import com.livic.auth.domain.MembershipTbl;
import com.livic.auth.domain.MembershipRoleTbl;
import com.livic.auth.service.interfaces.MembershipRoleCrudService;
import com.livic.auth.service.interfaces.MembershipCrudService;
import com.livic.auth.service.interfaces.RolePermissionCrudService;
import com.livic.user.domain.UserTbl;
import com.livic.user.service.interfaces.UserQueryService;
import com.livic.common.exception.BusinessException;
import com.livic.common.domain.UserRole;
import com.livic.common.constant.RoleConstants;


import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PropertyJoinCodeServiceImpl implements PropertyJoinCodeService {

    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final PropertyJoinCodeCrudService propertyJoinCodeCrudService;
    private final PropertyQueryService propertyQueryService;
    private final MembershipRoleCrudService membershipRoleCrudService;
    private final MembershipCrudService membershipCrudService;
    private final RolePermissionCrudService rolePermissionCrudService;
    private final UserQueryService userQueryService;

    @Override
    @Transactional
    public PropertyJoinCodeTbl generateJoinCode(UUID propertyId, String roleCode, int maxUses, UUID actorId) {
        PropertyTbl property = propertyQueryService.getPropertyById(propertyId);
        UserTbl actor = userQueryService.getUserById(actorId);

        // Fetch target role
        MembershipRoleTbl role = membershipRoleCrudService.findByCodeAndPropertyId(roleCode, propertyId)
                .or(() -> membershipRoleCrudService.findByCodeAndPropertyIdIsNull(roleCode))
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Role not found: " + roleCode));

        if (!role.isActive()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot generate join code for an inactive role.");
        }

        // Validate delegation subset rule (actor must have all permissions of the target role)
        if (!UserRole.SUPER_ADMIN.equals(actor.getGlobalRole())) {
            List<String> targetPerms = rolePermissionCrudService.findByRoleId(role.getId()).stream()
                    .map(rp -> rp.getPermission().getCode())
                    .toList();
            Set<String> actorPerms = membershipCrudService.findPermissionCodesByUserIdAndPropertyId(actorId, propertyId);
            if (!actorPerms.containsAll(targetPerms)) {
                throw new BusinessException(HttpStatus.FORBIDDEN, 
                        "Cannot invite someone to a role containing permissions you do not possess.");
            }
        }

        // Generate unique code
        String code = generateRandomCode(property.getName(), roleCode);
        
        PropertyJoinCodeTbl joinCode = PropertyJoinCodeTbl.builder()
                .property(property)
                .role(role)
                .code(code)
                .createdBy(actor)
                .maxUses(maxUses)
                .usesCount(0)
                .isActive(true)
                .expiresAt(Instant.now().plusSeconds(172800)) // Expires in 48 hours
                .build();

        return propertyJoinCodeCrudService.save(joinCode);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PropertyJoinCodeTbl> getPropertyJoinCodes(UUID propertyId) {
        return propertyJoinCodeCrudService.findByPropertyId(propertyId);
    }

    @Override
    @Transactional
    public MembershipTbl validateAndApplyJoinCode(String code, UUID userId) {
        String cleanCode = code.trim().toUpperCase();
        PropertyJoinCodeTbl joinCode = propertyJoinCodeCrudService.findByCode(cleanCode)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Invalid join code."));

        if (!joinCode.isActive()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Join code is no longer active.");
        }

        if (joinCode.getExpiresAt() != null && joinCode.getExpiresAt().isBefore(Instant.now())) {
            joinCode.setActive(false);
            propertyJoinCodeCrudService.save(joinCode);
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Join code has expired.");
        }

        if (joinCode.getUsesCount() >= joinCode.getMaxUses()) {
            joinCode.setActive(false);
            propertyJoinCodeCrudService.save(joinCode);
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Join code has reached its maximum uses.");
        }

        UserTbl user = userQueryService.getUserById(userId);
        PropertyTbl property = joinCode.getProperty();
        MembershipRoleTbl role = joinCode.getRole();

        // Check if user already holds this membership
        if (membershipCrudService.existsByUserIdAndPropertyIdAndRoleCode(userId, property.getId(), role.getCode())) {
            throw new BusinessException(HttpStatus.CONFLICT, "You are already a member of this property with this role.");
        }

        // Apply membership
        MembershipTbl membership = MembershipTbl.builder()
                .user(user)
                .property(property)
                .role(role)
                .assignedBy(joinCode.getCreatedBy())
                .build();

        MembershipTbl savedMembership = membershipCrudService.save(membership);

        // Increment uses
        joinCode.setUsesCount(joinCode.getUsesCount() + 1);
        if (joinCode.getUsesCount() >= joinCode.getMaxUses()) {
            joinCode.setActive(false);
        }
        propertyJoinCodeCrudService.save(joinCode);

        log.info("join_code_applied userId={} propertyId={} roleCode={} code={}",
                userId, property.getId(), role.getCode(), cleanCode);

        return savedMembership;
    }

    private String generateRandomCode(String propertyName, String roleCode) {
        String propAbbr = propertyName.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (propAbbr.length() > 4) {
            propAbbr = propAbbr.substring(0, 4);
        } else if (propAbbr.isEmpty()) {
            propAbbr = "PROP";
        }

        String roleAbbr = roleCode.replace(RoleConstants.PROPERTY_ROLE_PREFIX, "").substring(0, 3).toUpperCase();


        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
        }

        return String.format("%s-%s-%s", propAbbr, roleAbbr, sb.toString());
    }
}
