package com.livic.user.dto;

import com.livic.common.domain.UserRole;
import com.livic.auth.domain.MembershipTbl;
import com.livic.finance.domain.LeaseTbl;

import java.util.List;
import java.util.UUID;

public class MeDTOs {

    public record MyContextResponse(
            UserRole globalRole,
            List<MembershipSummary> managedProperties,
            List<MembershipSummary> tenantProperties,
            List<ActiveLeaseSummary> activeLeases,
            boolean isLandlord,
            boolean isTenant
    ) {
        public static MyContextResponse build(
                UserRole globalRole,
                List<MembershipSummary> managedProperties,
                List<MembershipSummary> tenantProperties,
                List<ActiveLeaseSummary> activeLeases
        ) {
            return new MyContextResponse(
                    globalRole,
                    managedProperties,
                    tenantProperties,
                    activeLeases,
                    !managedProperties.isEmpty(),
                    !activeLeases.isEmpty()
            );
        }
    }

    public record MembershipSummary(
            UUID propertyId,
            String propertyName,
            String membershipRoleCode,
            String membershipRoleName
    ) {
        public static MembershipSummary from(MembershipTbl membership) {
            return new MembershipSummary(
                    membership.getProperty().getId(),
                    membership.getProperty().getName(),
                    membership.getRole().getCode(),
                    membership.getRole().getName()
            );
        }
    }

    public record ActiveLeaseSummary(
            UUID leaseId,
            UUID propertyId,
            String propertyName,
            UUID unitId,
            String unitNumber,
            String status
    ) {
        public static ActiveLeaseSummary from(LeaseTbl lease) {
            return new ActiveLeaseSummary(
                    lease.getId(),
                    lease.getUnit().getProperty().getId(),
                    lease.getUnit().getProperty().getName(),
                    lease.getUnit().getId(),
                    lease.getUnit().getUnitNumber(),
                    lease.getStatus().name()
            );
        }
    }
}
