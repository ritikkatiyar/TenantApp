package com.tenantliving.user.dto;

import com.tenantliving.common.domain.UserRole;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class MeDTOs {

    public record MyContextResponse(
            UserRole globalRole,
            List<MembershipSummary> memberships,
            List<ActiveLeaseSummary> activeLeases
    ) {}

    public record MembershipSummary(
            UUID propertyId,
            String propertyName,
            String membershipRoleCode
    ) {}

    public record ActiveLeaseSummary(
            UUID leaseId,
            UUID propertyId,
            String propertyName,
            UUID unitId,
            String unitNumber,
            BigDecimal rentAmount,
            String status
    ) {}
}
