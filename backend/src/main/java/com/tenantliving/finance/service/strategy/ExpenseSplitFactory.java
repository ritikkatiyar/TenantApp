package com.tenantliving.finance.service.strategy;

import com.tenantliving.common.domain.ExpenseSplitStatus;
import com.tenantliving.common.domain.ExpenseSplitType;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.finance.domain.ExpenseTbl;
import com.tenantliving.finance.domain.ExpenseSplitTbl;

import java.math.BigDecimal;
import java.util.UUID;

final class ExpenseSplitFactory {
    private ExpenseSplitFactory() {
    }

    static ExpenseSplitTbl build(
            ExpenseTbl expense,
            UUID userId,
            ExpenseSplitType splitType,
            BigDecimal amount,
            BigDecimal percentage
    ) {
        if (amount == null) {
            throw new BusinessException("Split amount is required");
        }
        return ExpenseSplitTbl.builder()
                .expense(expense)
                .userId(userId)
                .splitType(splitType)
                .amount(amount)
                .percentage(percentage)
                .status(ExpenseSplitStatus.PENDING)
                .build();
    }
}
