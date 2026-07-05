package com.tenantliving.auth.service.impl;

import com.tenantliving.auth.domain.MembershipTbl;
import com.tenantliving.auth.repository.MembershipRepository;
import com.tenantliving.auth.service.interfaces.MembershipQueryService;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MembershipQueryServiceImpl implements MembershipQueryService {

    private final MembershipRepository membershipRepository;

    @Override
    public List<MembershipTbl> getMembershipsByPropertyId(UUID propertyId) {
        return membershipRepository.findByPropertyId(propertyId);
    }

    @Override
    public List<MembershipTbl> getMembershipsByUserId(UUID userId) {
        return membershipRepository.findByUserId(userId);
    }
}
