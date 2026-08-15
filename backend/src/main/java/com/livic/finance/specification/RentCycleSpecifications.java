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
        return (root, query, cb) -> {
            if (propertyId == null) {
                return null;
            }
            jakarta.persistence.criteria.Subquery<UUID> subquery = query.subquery(UUID.class);
            jakarta.persistence.criteria.Root<com.livic.property.domain.UnitTbl> unitRoot = subquery.from(com.livic.property.domain.UnitTbl.class);
            subquery.select(unitRoot.get("id"));
            subquery.where(cb.equal(unitRoot.get("property").get("id"), propertyId));
            
            return cb.in(root.get("lease").get("unitId")).value(subquery);
        };
    }

    public static Specification<RentCycleTbl> matchesSearch(String search) {
        return (root, query, cb) -> {
            if (search == null || search.trim().isEmpty()) {
                return null;
            }
            String searchPattern = "%" + search.trim().toLowerCase() + "%";

            jakarta.persistence.criteria.Subquery<UUID> unitSubquery = query.subquery(UUID.class);
            jakarta.persistence.criteria.Root<com.livic.property.domain.UnitTbl> unitRoot = unitSubquery.from(com.livic.property.domain.UnitTbl.class);
            unitSubquery.select(unitRoot.get("id"));
            unitSubquery.where(cb.like(cb.lower(unitRoot.get("unitNumber")), searchPattern));

            jakarta.persistence.criteria.Subquery<UUID> userSubquery = query.subquery(UUID.class);
            jakarta.persistence.criteria.Root<com.livic.user.domain.UserTbl> userRoot = userSubquery.from(com.livic.user.domain.UserTbl.class);
            userSubquery.select(userRoot.get("id"));
            userSubquery.where(cb.or(
                    cb.like(cb.lower(userRoot.get("fullName")), searchPattern),
                    cb.like(cb.lower(userRoot.get("phoneNumber")), searchPattern)
            ));

            return cb.or(
                    cb.in(root.get("lease").get("unitId")).value(unitSubquery),
                    cb.in(root.get("lease").get("userId")).value(userSubquery)
            );
        };
    }
}
