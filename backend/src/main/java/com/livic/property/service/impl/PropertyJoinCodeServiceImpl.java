package com.livic.property.service.impl;

import com.livic.auth.dto.MembershipSummaryDTO;
import com.livic.auth.dto.RoleDTOs;
import com.livic.auth.facade.AuthFacade;
import com.livic.common.exception.BusinessException;
import com.livic.property.domain.PropertyJoinCodeTbl;
import com.livic.property.domain.PropertyTbl;
import com.livic.property.dto.PropertyJoinCodeDTOs;
import com.livic.property.mapper.PropertyJoinCodeMapper;
import com.livic.property.service.interfaces.PropertyJoinCodeCrudService;
import com.livic.property.service.interfaces.PropertyJoinCodeService;
import com.livic.property.service.interfaces.PropertyQueryService;
import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

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
    public PropertyJoinCodeDTOs.JoinCodeResponse generateJoinCode(UUID propertyId, String roleCode, int maxUses, UUID actorId) {
        PropertyTbl property = propertyQueryService.getPropertyById(propertyId);
        UserSummaryDTO actor = userFacade.getUserById(actorId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Actor user not found"));

        RoleDTOs.RoleResponse role = authFacade.getRoleResponseForProperty(roleCode, propertyId);

        if (!role.isActive()) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Cannot generate join code for an inactive role.");
        }

        authFacade.validateCanDelegateRole(actorId, propertyId, roleCode,
                actor.globalRole() != null ? actor.globalRole().name() : null);

        String code = generateRandomCode(property.getName(), roleCode);

        PropertyJoinCodeTbl joinCode = PropertyJoinCodeTbl.builder()
                .property(property)
                .roleId(role.id())
                .code(code)
                .createdBy(actor.id())
                .maxUses(maxUses)
                .usesCount(0)
                .isActive(true)
                .expiresAt(Instant.now().plusSeconds(172800)) // 48 hours
                .build();

        PropertyJoinCodeTbl saved = propertyJoinCodeCrudService.save(joinCode);
        return PropertyJoinCodeMapper.toResponse(saved, role.code(), role.name());
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PropertyJoinCodeDTOs.JoinCodeResponse> getPropertyJoinCodes(UUID propertyId, Pageable pageable) {
        Page<PropertyJoinCodeTbl> page = propertyJoinCodeCrudService.findByPropertyId(propertyId, pageable);
        Map<UUID, RoleDTOs.RoleResponse> roleMap = authFacade.getPropertyRoles(propertyId).stream()
                .collect(Collectors.toMap(RoleDTOs.RoleResponse::id, r -> r, (r1, r2) -> r1));

        return page.map(jc -> {
            RoleDTOs.RoleResponse role = roleMap.get(jc.getRoleId());
            String rCode = role != null ? role.code() : "";
            String rName = role != null ? role.name() : "";
            return PropertyJoinCodeMapper.toResponse(jc, rCode, rName);
        });
    }

    @Override
    public PropertyJoinCodeDTOs.JoinCodeResultResponse validateAndApplyJoinCode(String code, UUID userId) {
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
        RoleDTOs.RoleResponse role = authFacade.getRoleById(joinCode.getRoleId());

        if (authFacade.existsByUserIdAndPropertyIdAndRoleCode(userId, property.getId(), role.code())) {
            throw new BusinessException(HttpStatus.CONFLICT, "You are already a member of this property with this role.");
        }

        MembershipSummaryDTO saved = authFacade.assignRole(property.getId(), userId, role.code(), joinCode.getCreatedBy());

        joinCode.setUsesCount(joinCode.getUsesCount() + 1);
        if (joinCode.getUsesCount() >= joinCode.getMaxUses()) {
            joinCode.setActive(false);
        }
        propertyJoinCodeCrudService.save(joinCode);

        log.info("join_code_applied userId={} propertyId={} roleCode={} code={}",
                userId, property.getId(), role.code(), cleanCode);

        return PropertyJoinCodeMapper.toResultResponse(
                property.getId(),
                property.getName(),
                role.code(),
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
