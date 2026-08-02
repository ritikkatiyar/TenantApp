package com.livic.property.service.impl;

import com.livic.auth.domain.MembershipRoleTbl;
import com.livic.auth.domain.MembershipTbl;
import com.livic.auth.dto.MembershipSummaryDTO;
import com.livic.auth.facade.AuthFacade;
import com.livic.common.exception.BusinessException;
import com.livic.property.domain.PropertyJoinCodeTbl;
import com.livic.property.domain.PropertyTbl;
import com.livic.property.dto.PropertyJoinCodeDTOs;
import com.livic.property.service.interfaces.PropertyJoinCodeCrudService;
import com.livic.property.service.interfaces.PropertyJoinCodeService;
import com.livic.property.service.interfaces.PropertyQueryService;
import com.livic.user.domain.UserTbl;
import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class PropertyJoinCodeServiceImpl implements PropertyJoinCodeService {

    private static final String ALPHANUMERIC = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final PropertyJoinCodeCrudService propertyJoinCodeCrudService;
    private final PropertyQueryService propertyQueryService;
    private final AuthFacade authFacade;
    private final UserFacade userFacade;

    @Override
    public PropertyJoinCodeTbl generateJoinCode(UUID propertyId, String roleCode, int maxUses, UUID actorId) {
        PropertyTbl property = propertyQueryService.getPropertyById(propertyId);
        UserSummaryDTO actor = userFacade.getUserById(actorId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Actor user not found"));

        MembershipRoleTbl role = authFacade.getRoleForProperty(roleCode, propertyId);

        if (!role.isActive()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot generate join code for an inactive role.");
        }

        authFacade.validateCanDelegateRole(actorId, propertyId, roleCode,
                actor.globalRole() != null ? actor.globalRole().name() : null);

        String code = generateRandomCode(property.getName(), roleCode);

        UserTbl actorRef = new UserTbl();
        actorRef.setId(actor.id());

        PropertyJoinCodeTbl joinCode = PropertyJoinCodeTbl.builder()
                .property(property)
                .role(role)
                .code(code)
                .createdBy(actorRef)
                .maxUses(maxUses)
                .usesCount(0)
                .isActive(true)
                .expiresAt(Instant.now().plusSeconds(172800)) // 48 hours
                .build();

        return propertyJoinCodeCrudService.save(joinCode);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PropertyJoinCodeTbl> getPropertyJoinCodes(UUID propertyId) {
        return propertyJoinCodeCrudService.findByPropertyId(propertyId);
    }

    @Override
    public MembershipTbl validateAndApplyJoinCode(String code, UUID userId) {
        String cleanCode = code != null ? code.trim().toUpperCase() : "";

        PropertyJoinCodeTbl joinCode = propertyJoinCodeCrudService.findByCode(cleanCode)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Invalid join code."));

        if (!joinCode.isActive()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Join code is inactive.");
        }

        if (joinCode.getExpiresAt().isBefore(Instant.now())) {
            joinCode.setActive(false);
            propertyJoinCodeCrudService.save(joinCode);
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Join code has expired.");
        }

        if (joinCode.getUsesCount() >= joinCode.getMaxUses()) {
            joinCode.setActive(false);
            propertyJoinCodeCrudService.save(joinCode);
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Join code has reached its maximum uses.");
        }

        PropertyTbl property = joinCode.getProperty();
        MembershipRoleTbl role = joinCode.getRole();

        if (authFacade.existsByUserIdAndPropertyIdAndRoleCode(userId, property.getId(), role.getCode())) {
            throw new BusinessException(HttpStatus.CONFLICT, "You are already a member of this property with this role.");
        }

        UUID createdByUserId = joinCode.getCreatedBy() != null ? joinCode.getCreatedBy().getId() : null;
        MembershipSummaryDTO saved = authFacade.assignRole(property.getId(), userId, role.getCode(), createdByUserId);

        joinCode.setUsesCount(joinCode.getUsesCount() + 1);
        if (joinCode.getUsesCount() >= joinCode.getMaxUses()) {
            joinCode.setActive(false);
        }
        propertyJoinCodeCrudService.save(joinCode);

        log.info("join_code_applied userId={} propertyId={} roleCode={} code={}",
                userId, property.getId(), role.getCode(), cleanCode);

        // Build a MembershipTbl shell from the DTO for the return contract
        com.livic.auth.domain.MembershipTbl membershipRef = new com.livic.auth.domain.MembershipTbl();
        membershipRef.setId(saved.id());
        return membershipRef;
    }

    @Override
    public PropertyJoinCodeDTOs.JoinCodeResultResponse validateAndApplyJoinCodeResult(String code, UUID userId) {
        String cleanCode = code != null ? code.trim().toUpperCase() : "";

        PropertyJoinCodeTbl joinCode = propertyJoinCodeCrudService.findByCode(cleanCode)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Invalid join code."));

        if (!joinCode.isActive()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Join code is inactive.");
        }

        if (joinCode.getExpiresAt().isBefore(Instant.now())) {
            joinCode.setActive(false);
            propertyJoinCodeCrudService.save(joinCode);
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Join code has expired.");
        }

        if (joinCode.getUsesCount() >= joinCode.getMaxUses()) {
            joinCode.setActive(false);
            propertyJoinCodeCrudService.save(joinCode);
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Join code has reached its maximum uses.");
        }

        PropertyTbl property = joinCode.getProperty();
        MembershipRoleTbl role = joinCode.getRole();

        if (authFacade.existsByUserIdAndPropertyIdAndRoleCode(userId, property.getId(), role.getCode())) {
            throw new BusinessException(HttpStatus.CONFLICT, "You are already a member of this property with this role.");
        }

        UUID createdByUserId = joinCode.getCreatedBy() != null ? joinCode.getCreatedBy().getId() : null;
        MembershipSummaryDTO saved = authFacade.assignRole(property.getId(), userId, role.getCode(), createdByUserId);

        joinCode.setUsesCount(joinCode.getUsesCount() + 1);
        if (joinCode.getUsesCount() >= joinCode.getMaxUses()) {
            joinCode.setActive(false);
        }
        propertyJoinCodeCrudService.save(joinCode);

        log.info("join_code_applied userId={} propertyId={} roleCode={} code={}",
                userId, property.getId(), role.getCode(), cleanCode);

        return new PropertyJoinCodeDTOs.JoinCodeResultResponse(
                property.getId(),
                property.getName(),
                role.getCode(),
                saved.id()
        );
    }

    private String generateRandomCode(String propertyName, String roleCode) {
        String propAbbr = propertyName.replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
        if (propAbbr.length() > 4) propAbbr = propAbbr.substring(0, 4);
        String roleAbbr = roleCode.replace("PROPERTY_", "");
        if (roleAbbr.length() > 3) roleAbbr = roleAbbr.substring(0, 3);
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(ALPHANUMERIC.charAt(RANDOM.nextInt(ALPHANUMERIC.length())));
        }
        return propAbbr + "-" + roleAbbr + "-" + sb.toString();
    }
}
