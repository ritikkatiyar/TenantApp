package com.livic.finance.specification;

import com.livic.finance.domain.FinanceLedgerTbl;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.UUID;

public class FinanceLedgerSpecifications {

    private FinanceLedgerSpecifications() {
        // Private constructor to prevent instantiation
    }

    public static Specification<FinanceLedgerTbl> hasPropertyId(UUID propertyId) {
        return (root, query, cb) -> {
            if (propertyId == null) {
                return null;
            }
            jakarta.persistence.criteria.Subquery<UUID> subquery = query.subquery(UUID.class);
            jakarta.persistence.criteria.Root<com.livic.property.domain.UnitTbl> unitRoot = subquery.from(com.livic.property.domain.UnitTbl.class);
            subquery.select(unitRoot.get("id"));
            subquery.where(cb.equal(unitRoot.get("property").get("id"), propertyId));

            return cb.in(root.get("unitId")).value(subquery);
        };
    }

    public static Specification<FinanceLedgerTbl> createdAfter(LocalDateTime fromDate) {
        return (root, query, cb) -> fromDate == null
                ? null
                : cb.greaterThanOrEqualTo(root.get("createdAt"), fromDate);
    }

    public static Specification<FinanceLedgerTbl> createdBefore(LocalDateTime toDate) {
        return (root, query, cb) -> toDate == null
                ? null
                : cb.lessThanOrEqualTo(root.get("createdAt"), toDate);
    }
}
