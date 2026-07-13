package com.tenantliving.finance.specification;

import com.tenantliving.finance.domain.FinanceLedgerTbl;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDateTime;
import java.util.UUID;

public class FinanceLedgerSpecifications {

    private FinanceLedgerSpecifications() {
        // Private constructor to prevent instantiation
    }

    public static Specification<FinanceLedgerTbl> hasPropertyId(UUID propertyId) {
        return (root, query, cb) -> propertyId == null
                ? null
                : cb.equal(root.get("unit").get("property").get("id"), propertyId);
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
