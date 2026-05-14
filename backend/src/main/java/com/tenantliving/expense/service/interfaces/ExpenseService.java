package com.tenantliving.expense.service.interfaces;

import com.tenantliving.expense.domain.ExpenseTbl;
import com.tenantliving.expense.dto.ExpenseDTOs;

import java.util.List;
import java.util.UUID;

public interface ExpenseService {
    ExpenseTbl create(ExpenseDTOs.CreateExpenseRequest request);

    ExpenseTbl getById(UUID id);

    List<ExpenseTbl> list(UUID expenseGroupId, String billingMonth);
}
