package com.livic.finance.specification;

import com.livic.common.domain.RentCycleStatus;
import com.livic.finance.domain.RentCycleTbl;
import com.livic.property.domain.UnitTbl;
import com.livic.user.domain.UserTbl;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import org.springframework.data.jpa.domain.Specification;

import java.util.Collection;
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
            Subquery<UUID> subquery = query.subquery(UUID.class);
            Root<UnitTbl> unitRoot = subquery.from(UnitTbl.class);
            subquery.select(unitRoot.get("id"));
            subquery.where(cb.equal(unitRoot.get("property").get("id"), propertyId));

            return cb.in(root.get("lease").get("unitId")).value(subquery);
        };
    }

    public static Specification<RentCycleTbl> hasPropertyIdIn(Collection<UUID> propertyIds) {
        return (root, query, cb) -> {
            if (propertyIds == null || propertyIds.isEmpty()) {
                return cb.disjunction();
            }
            Subquery<UUID> subquery = query.subquery(UUID.class);
            Root<UnitTbl> unitRoot = subquery.from(UnitTbl.class);
            subquery.select(unitRoot.get("id"));
            subquery.where(unitRoot.get("property").get("id").in(propertyIds));

            return cb.in(root.get("lease").get("unitId")).value(subquery);
        };
    }


    public static Specification<RentCycleTbl> matchesSearch(String search) {
        return (root, query, cb) -> {
            if (search == null || search.trim().isEmpty()) {
                return null;
            }
            String searchPattern = "%" + search.trim().toLowerCase() + "%";

            Subquery<UUID> unitSubquery = query.subquery(UUID.class);
            Root<UnitTbl> unitRoot = unitSubquery.from(UnitTbl.class);
            unitSubquery.select(unitRoot.get("id"));
            unitSubquery.where(cb.like(cb.lower(unitRoot.get("unitNumber")), searchPattern));

            Subquery<UUID> userSubquery = query.subquery(UUID.class);
            Root<UserTbl> userRoot = userSubquery.from(UserTbl.class);
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
