package com.livic.finance.mapper;

import com.livic.finance.domain.ExpenseGroupTbl;
import com.livic.finance.domain.ExpenseTbl;
import com.livic.finance.dto.ExpenseDTOs;

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

    public static ExpenseTbl toEntity(ExpenseDTOs.CreateExpenseRequest request, ExpenseGroupTbl group) {
        return ExpenseTbl.builder()
                .expenseGroup(group)
                .createdBy(request.createdBy())
                .totalAmount(request.totalAmount())
                .expenseType(request.expenseType())
                .description(request.description())
                .billingMonth(request.billingMonth())
                .build();
    }
}
