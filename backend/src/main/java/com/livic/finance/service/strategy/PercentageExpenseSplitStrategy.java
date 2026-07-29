package com.livic.finance.service.strategy;

import com.livic.common.domain.ExpenseSplitType;
import com.livic.common.exception.BusinessException;
import com.livic.finance.domain.ExpenseTbl;
import com.livic.finance.domain.ExpenseSplitTbl;
import com.livic.finance.dto.ExpenseSplitDTOs;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Set;

@Component
public class PercentageExpenseSplitStrategy implements ExpenseSplitCalculationStrategy {

    private static final BigDecimal ONE_HUNDRED = new BigDecimal("100.00");

    @Override
    public Set<ExpenseSplitType> supportedTypes() {
        return Set.of(ExpenseSplitType.PERCENTAGE);
    }

    @Override
    public List<ExpenseSplitTbl> calculate(
            ExpenseTbl expense,
            ExpenseSplitType splitType,
            List<ExpenseSplitDTOs.ParticipantRequest> participants
    ) {
        if (participants.stream().anyMatch(participant -> participant.percentage() == null)) {
            throw new BusinessException("Percentage is required for percentage splits");
        }
        BigDecimal totalPercentage = participants.stream()
                .map(ExpenseSplitDTOs.ParticipantRequest::percentage)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalPercentage.compareTo(ONE_HUNDRED) != 0) {
            throw new BusinessException("Percentage splits must total 100.00");
        }
        return participants.stream()
                .map(participant -> ExpenseSplitFactory.build(
                        expense,
                        participant.userId(),
                        splitType,
                        expense.getTotalAmount().multiply(participant.percentage()).divide(ONE_HUNDRED, 2, RoundingMode.HALF_UP),
                        participant.percentage()
                ))
                .toList();
    }
}
