package com.livic.user.service.impl;

import com.livic.user.dto.MeDTOs;
import com.livic.user.service.interfaces.MeService;
import com.livic.user.service.interfaces.UserQueryService;
import com.livic.user.domain.UserTbl;
import com.livic.auth.dto.MembershipSummaryDTO;
import com.livic.auth.facade.AuthFacade;
import com.livic.finance.facade.FinanceFacade;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MeServiceImpl implements MeService {

    private final UserQueryService userQueryService;
    private final AuthFacade authFacade;
    private final FinanceFacade financeFacade;

    @Override
    @Transactional(readOnly = true)
    public MeDTOs.MyContextResponse getUserContext(UUID userId) {
        UserTbl user = userQueryService.getUserById(userId);
        
        List<MembershipSummaryDTO> memberships = authFacade.getMembershipsByUserId(userId);
        
        List<MeDTOs.MembershipSummary> managedProperties = memberships.stream()
                .filter(m -> m.propertyId() != null && !"PROPERTY_TENANT".equals(m.roleCode()))
                .map(MeDTOs.MembershipSummary::from)
                .toList();
                
        List<MeDTOs.MembershipSummary> tenantProperties = memberships.stream()
                .filter(m -> m.propertyId() != null && "PROPERTY_TENANT".equals(m.roleCode()))
                .map(MeDTOs.MembershipSummary::from)
                .toList();

        List<MeDTOs.ActiveLeaseSummary> activeLeases = financeFacade.getActiveLeaseForUser(userId)
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
