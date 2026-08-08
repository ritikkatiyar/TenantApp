package com.livic.finance.specification;

import com.livic.common.domain.RentCycleStatus;
import com.livic.finance.domain.RentCycleTbl;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public class RentCycleSpecifications {

    private RentCycleSpecifications() {
        // Private constructor to prevent instantiation
    }

    public static Specification<RentCycleTbl> hasLeaseId(UUID leaseId) {
        return (root, query, cb) -> leaseId == null
                ? null
                : cb.equal(root.get("lease").get("id"), leaseId);
    }

    public static Specification<RentCycleTbl> hasBillingMonth(String billingMonth) {
        return (root, query, cb) -> billingMonth == null
                ? null
                : cb.equal(root.get("billingMonth"), billingMonth);
    }

    public static Specification<RentCycleTbl> hasStatus(RentCycleStatus status) {
        return (root, query, cb) -> status == null
                ? null
                : cb.equal(root.get("status"), status);
    }

    public static Specification<RentCycleTbl> hasPropertyId(UUID propertyId) {
        return (root, query, cb) -> propertyId == null
                ? null
                : cb.equal(root.get("lease").get("unit").get("property").get("id"), propertyId);
    }
}
