package com.tenantliving.finance.service.strategy;

import com.tenantliving.common.domain.ExpenseSplitType;
import com.tenantliving.finance.domain.ExpenseTbl;
import com.tenantliving.finance.domain.ExpenseSplitTbl;
import com.tenantliving.finance.dto.ExpenseSplitDTOs;

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
