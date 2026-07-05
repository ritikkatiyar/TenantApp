package com.tenantliving.user.service.impl;

import com.tenantliving.user.dto.MeDTOs;
import com.tenantliving.user.service.interfaces.MeService;
import com.tenantliving.user.service.interfaces.UserQueryService;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.auth.domain.MembershipTbl;
import com.tenantliving.auth.service.interfaces.MembershipQueryService;
import com.tenantliving.finance.service.interfaces.LeaseQueryService;
import com.tenantliving.common.domain.LeaseStatus;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MeServiceImpl implements MeService {

    private final UserQueryService userQueryService;
    private final MembershipQueryService membershipQueryService;
    private final LeaseQueryService leaseQueryService;

    @Override
    @Transactional(readOnly = true)
    public MeDTOs.MyContextResponse getUserContext(UUID userId) {
        UserTbl user = userQueryService.getUserById(userId);
        
        List<MembershipTbl> memberships = membershipQueryService.getMembershipsByUserId(userId);
        
        List<MeDTOs.MembershipSummary> managedProperties = memberships.stream()
                .filter(m -> m.getProperty() != null && !m.getRole().getCode().equals("PROPERTY_TENANT"))
                .map(MeDTOs.MembershipSummary::from)
                .toList();
                
        List<MeDTOs.MembershipSummary> tenantProperties = memberships.stream()
                .filter(m -> m.getProperty() != null && m.getRole().getCode().equals("PROPERTY_TENANT"))
                .map(MeDTOs.MembershipSummary::from)
                .toList();

        List<MeDTOs.ActiveLeaseSummary> activeLeases = leaseQueryService.findByUserIdAndStatus(userId, LeaseStatus.ACTIVE)
                .map(lease -> List.of(MeDTOs.ActiveLeaseSummary.from(lease)))
                .orElse(List.of());

        return MeDTOs.MyContextResponse.build(
                user.getGlobalRole(),
                managedProperties,
                tenantProperties,
                activeLeases
        );
    }
}
