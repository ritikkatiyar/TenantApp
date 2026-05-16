package com.tenantliving.finance.service.strategy;

import com.tenantliving.common.domain.ExpenseSplitType;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.finance.domain.ExpenseTbl;
import com.tenantliving.finance.domain.ExpenseSplitTbl;
import com.tenantliving.finance.dto.ExpenseSplitDTOs;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Component
public class AmountExpenseSplitStrategy implements ExpenseSplitCalculationStrategy {

    @Override
    public Set<ExpenseSplitType> supportedTypes() {
        return Set.of(ExpenseSplitType.FIXED, ExpenseSplitType.CUSTOM);
    }

    @Override
    public List<ExpenseSplitTbl> calculate(
            ExpenseTbl expense,
            ExpenseSplitType splitType,
            List<ExpenseSplitDTOs.ParticipantRequest> participants
    ) {
        if (participants.stream().anyMatch(participant -> participant.amount() == null)) {
            throw new BusinessException("Amount is required for fixed and custom splits");
        }
        BigDecimal totalAmount = participants.stream()
                .map(ExpenseSplitDTOs.ParticipantRequest::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (totalAmount.compareTo(expense.getTotalAmount()) != 0) {
            throw new BusinessException("Split amounts must equal expense total");
        }
        return participants.stream()
                .map(participant -> ExpenseSplitFactory.build(
                        expense,
                        participant.userId(),
                        splitType,
                        participant.amount(),
                        participant.percentage()
                ))
                .toList();
    }
}
