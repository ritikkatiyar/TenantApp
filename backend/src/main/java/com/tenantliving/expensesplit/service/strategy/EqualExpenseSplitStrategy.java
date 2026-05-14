package com.tenantliving.expensesplit.service.strategy;

import com.tenantliving.common.domain.ExpenseSplitType;
import com.tenantliving.expense.domain.ExpenseTbl;
import com.tenantliving.expensesplit.domain.ExpenseSplitTbl;
import com.tenantliving.expensesplit.dto.ExpenseSplitDTOs;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@Component
public class EqualExpenseSplitStrategy implements ExpenseSplitCalculationStrategy {

    @Override
    public Set<ExpenseSplitType> supportedTypes() {
        return Set.of(ExpenseSplitType.EQUAL);
    }

    @Override
    public List<ExpenseSplitTbl> calculate(
            ExpenseTbl expense,
            ExpenseSplitType splitType,
            List<ExpenseSplitDTOs.ParticipantRequest> participants
    ) {
        BigDecimal share = expense.getTotalAmount().divide(BigDecimal.valueOf(participants.size()), 2, RoundingMode.DOWN);
        BigDecimal allocated = share.multiply(BigDecimal.valueOf(participants.size()));
        BigDecimal remainder = expense.getTotalAmount().subtract(allocated);
        List<ExpenseSplitTbl> splits = new ArrayList<>();
        for (int i = 0; i < participants.size(); i++) {
            BigDecimal amount = i == 0 ? share.add(remainder) : share;
            splits.add(ExpenseSplitFactory.build(expense, participants.get(i).userId(), splitType, amount, null));
        }
        return splits;
    }
}
