package com.tenantliving.expensesplit.service.strategy;

import com.tenantliving.common.domain.ExpenseSplitType;
import com.tenantliving.expense.domain.ExpenseTbl;
import com.tenantliving.expensesplit.domain.ExpenseSplitTbl;
import com.tenantliving.expensesplit.dto.ExpenseSplitDTOs;

import java.util.List;
import java.util.Set;

public interface ExpenseSplitCalculationStrategy {
    Set<ExpenseSplitType> supportedTypes();

    List<ExpenseSplitTbl> calculate(
            ExpenseTbl expense,
            ExpenseSplitType splitType,
            List<ExpenseSplitDTOs.ParticipantRequest> participants
    );
}
