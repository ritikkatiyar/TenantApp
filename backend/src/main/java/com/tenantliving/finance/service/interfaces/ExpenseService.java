package com.tenantliving.finance.service.interfaces;

import com.tenantliving.finance.domain.ExpenseTbl;
import com.tenantliving.finance.dto.ExpenseDTOs;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

public interface ExpenseService {
    ExpenseTbl create(ExpenseDTOs.CreateExpenseRequest request);

    ExpenseTbl getById(UUID id);

    Page<ExpenseTbl> list(UUID expenseGroupId, String billingMonth, Pageable pageable);
}
