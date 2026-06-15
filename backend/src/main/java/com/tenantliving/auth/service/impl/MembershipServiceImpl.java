package com.tenantliving.auth.service.impl;

import com.tenantliving.auth.domain.MembershipRoleTbl;
import com.tenantliving.auth.domain.MembershipTbl;
import com.tenantliving.auth.repository.MembershipRepository;
import com.tenantliving.auth.repository.MembershipRoleRepository;
import com.tenantliving.auth.service.interfaces.MembershipService;
import com.tenantliving.property.domain.PropertyTbl;
import com.tenantliving.property.repository.PropertyRepository;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MembershipServiceImpl implements MembershipService {

    private final MembershipRepository membershipRepository;
    private final MembershipRoleRepository membershipRoleRepository;
    private final UserRepository userRepository;
    private final PropertyRepository propertyRepository;

    @Override
    @Transactional
    public void ensureTenantRole(UUID tenantId, UUID propertyId, UUID assignedByUserId) {
        if (membershipRepository.existsByUserIdAndPropertyId(tenantId, propertyId)) {
            return; // Already has some role here
        }

        UserTbl tenant = userRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
        PropertyTbl property = propertyRepository.findById(propertyId)
                .orElseThrow(() -> new RuntimeException("Property not found"));
        UserTbl assigner = assignedByUserId != null ? userRepository.findById(assignedByUserId).orElse(null) : null;
        
        MembershipRoleTbl tenantRole = membershipRoleRepository.findByCode("PROPERTY_TENANT")
                .orElseThrow(() -> new RuntimeException("PROPERTY_TENANT role not found"));

        MembershipTbl membership = MembershipTbl.builder()
                .user(tenant)
                .property(property)
                .role(tenantRole)
                .assignedBy(assigner)
                .build();
        
        membershipRepository.save(membership);
    }

    @Override
    @Transactional
    public void removeTenantRole(UUID tenantId, UUID propertyId) {
        Optional<MembershipTbl> membershipOpt = membershipRepository.findByUserIdAndPropertyId(tenantId, propertyId);
        if (membershipOpt.isPresent() && membershipOpt.get().getRole().getCode().equals("PROPERTY_TENANT")) {
            membershipRepository.delete(membershipOpt.get());
        }
    }
}
