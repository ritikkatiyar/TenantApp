package com.tenantliving.finance.specification;

import com.tenantliving.finance.domain.ExpenseTbl;
import org.springframework.data.jpa.domain.Specification;

import java.util.UUID;

public class ExpenseSpecifications {

    private ExpenseSpecifications() {
        // Private constructor to prevent instantiation
    }

    public static Specification<ExpenseTbl> hasExpenseGroupId(UUID expenseGroupId) {
        return (root, query, cb) -> expenseGroupId == null
                ? null
                : cb.equal(root.get("expenseGroup").get("id"), expenseGroupId);
    }

    public static Specification<ExpenseTbl> hasBillingMonth(String billingMonth) {
        return (root, query, cb) -> billingMonth == null
                ? null
                : cb.equal(root.get("billingMonth"), billingMonth);
    }
}
