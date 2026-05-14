package com.tenantliving.expensesplit.mapper;

import com.tenantliving.expensesplit.domain.ExpenseSplitTbl;
import com.tenantliving.expensesplit.dto.ExpenseSplitDTOs;

public final class ExpenseSplitMapper {
    private ExpenseSplitMapper() {
    }

    public static ExpenseSplitDTOs.ExpenseSplitResponse toResponse(ExpenseSplitTbl split) {
        return new ExpenseSplitDTOs.ExpenseSplitResponse(
                split.getId(),
                split.getExpense().getId(),
                split.getUserId(),
                split.getSplitType(),
                split.getAmount(),
                split.getPercentage(),
                split.getStatus(),
                split.getPaidAt(),
                split.getCreatedAt()
        );
    }
}
