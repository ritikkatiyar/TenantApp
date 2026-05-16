package com.tenantliving.finance.service.interfaces;

import com.tenantliving.finance.domain.ExpenseTbl;
import com.tenantliving.finance.dto.ExpenseDTOs;

import java.util.List;
import java.util.UUID;

public interface ExpenseService {
    ExpenseTbl create(ExpenseDTOs.CreateExpenseRequest request);

    ExpenseTbl getById(UUID id);

    List<ExpenseTbl> list(UUID expenseGroupId, String billingMonth);
}
