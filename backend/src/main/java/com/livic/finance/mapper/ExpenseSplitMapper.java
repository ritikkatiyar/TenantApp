package com.livic.finance.mapper;

import com.livic.finance.domain.ExpenseSplitTbl;
import com.livic.finance.dto.ExpenseSplitDTOs;

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
