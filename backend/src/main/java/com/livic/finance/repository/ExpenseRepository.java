package com.livic.finance.repository;

import com.livic.finance.domain.ExpenseTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ExpenseRepository extends JpaRepository<ExpenseTbl, UUID>, JpaSpecificationExecutor<ExpenseTbl> {
    List<ExpenseTbl> findByExpenseGroup_Id(UUID expenseGroupId);

    List<ExpenseTbl> findByBillingMonth(String billingMonth);
}
