package com.tenantliving.user.dto;

import com.tenantliving.common.domain.PropertyRole;
import com.tenantliving.common.domain.UserRole;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class MeDTOs {

    public record MyContextResponse(
            UserRole globalRole,
            List<PropertyRoleSummary> propertyRoles,
            List<ActiveLeaseSummary> activeLeases
    ) {}

    public record PropertyRoleSummary(
            UUID propertyId,
            String propertyName,
            PropertyRole role
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
