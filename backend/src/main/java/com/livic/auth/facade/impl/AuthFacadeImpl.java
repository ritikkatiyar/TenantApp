package com.livic.auth.facade.impl;

import com.livic.auth.domain.MembershipPermissionTbl;
import com.livic.auth.domain.MembershipTbl;
import com.livic.auth.dto.MembershipSummaryDTO;
import com.livic.auth.facade.AuthFacade;
import com.livic.auth.mapper.MembershipMapper;
import com.livic.auth.service.interfaces.MembershipCrudService;
import com.livic.auth.service.interfaces.MembershipPermissionCrudService;
import com.livic.auth.service.interfaces.MembershipService;
import com.livic.common.enums.AccessType;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class AuthFacadeImpl implements AuthFacade {

    private final MembershipCrudService membershipCrudService;
    private final MembershipPermissionCrudService membershipPermissionCrudService;
    private final MembershipService membershipService;

    @Override
    public List<MembershipSummaryDTO> getMembershipsByUserId(UUID userId) {
        return membershipCrudService.findByUserId(userId).stream()
                .map(MembershipMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<MembershipSummaryDTO> getMembershipsByPropertyId(UUID propertyId) {
        return membershipCrudService.findByPropertyId(propertyId).stream()
                .map(MembershipMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public Page<MembershipSummaryDTO> getMembershipsByPropertyId(UUID propertyId, Pageable pageable) {
        return membershipCrudService.findByPropertyId(propertyId, pageable)
                .map(MembershipMapper::toResponse);
    }

    @Override
    public long countMembershipsByPropertyId(UUID propertyId) {
        return membershipCrudService.findByPropertyId(propertyId).size();
    }

    @Override
    public void createOwnerMembership(UUID propertyId, UUID userId) {
        membershipService.createOwnerMembership(propertyId, userId);
    }

    @Override
    public boolean existsByUserIdAndPropertyId(UUID userId, UUID propertyId) {
        return membershipCrudService.existsByUserIdAndPropertyId(userId, propertyId);
    }

    @Override
    public MembershipSummaryDTO createMembership(UUID propertyId, UUID userId, String title, AccessType accessType, Set<String> permissionCodes, UUID assignedByUserId) {
        MembershipTbl saved = membershipService.createMembership(propertyId, userId, title, accessType, permissionCodes, assignedByUserId);
        return MembershipMapper.toResponse(saved);
    }

    @Override
    public MembershipSummaryDTO updateMembership(UUID propertyId, UUID membershipId, String title, AccessType accessType, Boolean isActive, Set<String> permissionCodes, UUID actorUserId) {
        MembershipTbl updated = membershipService.updateMembership(propertyId, membershipId, title, accessType, isActive, permissionCodes, actorUserId);
        return MembershipMapper.toResponse(updated);
    }

    @Override
    public void toggleMembershipActive(UUID propertyId, UUID membershipId, boolean active, UUID actorId) {
        membershipService.toggleMembershipActive(propertyId, membershipId, active, actorId);
    }

    @Override
    public void removeMembership(UUID propertyId, UUID membershipId, UUID actorId) {
        membershipService.removeMembership(propertyId, membershipId, actorId);
    }

    @Override
    public void transferOwnership(UUID propertyId, UUID currentOwnerId, UUID toUserId) {
        membershipService.transferOwnership(propertyId, currentOwnerId, toUserId);
    }

    @Override
    public Set<String> getMembershipPermissions(UUID membershipId) {
        return membershipPermissionCrudService.findPermissionCodesByMembershipId(membershipId);
    }

    @Override
    public Map<UUID, Set<String>> getPermissionsByMembershipIds(Collection<UUID> membershipIds) {
        if (membershipIds == null || membershipIds.isEmpty()) {
            return Collections.emptyMap();
        }
        List<MembershipPermissionTbl> rows = membershipPermissionCrudService.findByMembershipIdIn(membershipIds);
        return rows.stream()
                .filter(mp -> mp.getMembership() != null && mp.getMembership().getId() != null && mp.getPermission() != null)
                .collect(Collectors.groupingBy(
                        mp -> mp.getMembership().getId(),
                        Collectors.mapping(mp -> mp.getPermission().getCode(), Collectors.toSet())
                ));
    }
}
