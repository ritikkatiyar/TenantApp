package com.tenantliving.expense.repository;

import com.tenantliving.expense.domain.ExpenseTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExpenseRepository extends JpaRepository<ExpenseTbl, UUID> {
    List<ExpenseTbl> findByExpenseGroup_Id(UUID expenseGroupId);

    List<ExpenseTbl> findByBillingMonth(String billingMonth);
}
