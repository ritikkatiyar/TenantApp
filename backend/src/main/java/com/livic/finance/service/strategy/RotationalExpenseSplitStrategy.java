package com.livic.finance.service.strategy;

import com.livic.common.domain.ExpenseSplitType;
import com.livic.finance.domain.ExpenseTbl;
import com.livic.finance.domain.ExpenseSplitTbl;
import com.livic.finance.dto.ExpenseSplitDTOs;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Component
public class RotationalExpenseSplitStrategy implements ExpenseSplitCalculationStrategy {

    @Override
    public Set<ExpenseSplitType> supportedTypes() {
        return Set.of(ExpenseSplitType.ROTATIONAL);
    }

    @Override
    public List<ExpenseSplitTbl> calculate(
            ExpenseTbl expense,
            ExpenseSplitType splitType,
            List<ExpenseSplitDTOs.ParticipantRequest> participants
    ) {
        return participants.stream()
                .map(participant -> ExpenseSplitFactory.build(
                        expense,
                        participant.userId(),
                        splitType,
                        participant.equals(participants.get(0)) ? expense.getTotalAmount() : BigDecimal.ZERO,
                        null
                ))
                .toList();
    }
}
