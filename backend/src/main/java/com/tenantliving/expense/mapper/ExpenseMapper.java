package com.tenantliving.expense.mapper;

import com.tenantliving.expense.domain.ExpenseTbl;
import com.tenantliving.expense.dto.ExpenseDTOs;

public final class ExpenseMapper {
    private ExpenseMapper() {
    }

    public static ExpenseDTOs.ExpenseResponse toResponse(ExpenseTbl expense) {
        return new ExpenseDTOs.ExpenseResponse(
                expense.getId(),
                expense.getExpenseGroup().getId(),
                expense.getCreatedBy(),
                expense.getTotalAmount(),
                expense.getExpenseType(),
                expense.getDescription(),
                expense.getBillingMonth(),
                expense.getCreatedAt()
        );
    }
}
