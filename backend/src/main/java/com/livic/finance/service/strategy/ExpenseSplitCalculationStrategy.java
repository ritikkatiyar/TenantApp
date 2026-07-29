package com.livic.finance.service.strategy;

import com.livic.common.domain.ExpenseSplitType;
import com.livic.finance.domain.ExpenseTbl;
import com.livic.finance.domain.ExpenseSplitTbl;
import com.livic.finance.dto.ExpenseSplitDTOs;

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
