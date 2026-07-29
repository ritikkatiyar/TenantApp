package com.livic.finance.service.interfaces;

import com.livic.finance.domain.ExpenseTbl;
import com.livic.finance.dto.ExpenseDTOs;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.UUID;

public interface ExpenseService {
    ExpenseTbl create(ExpenseDTOs.CreateExpenseRequest request);

    ExpenseTbl getById(UUID id);

    Page<ExpenseTbl> list(UUID expenseGroupId, String billingMonth, Pageable pageable);
}
