package com.livic.finance.service.interfaces;

import com.livic.common.domain.ExpenseSplitStatus;
import com.livic.finance.domain.ExpenseSplitTbl;
import com.livic.common.service.interfaces.CrudService;

import java.util.List;
import java.util.UUID;

public interface ExpenseSplitCrudService extends CrudService<ExpenseSplitTbl, UUID> {
    List<ExpenseSplitTbl> findByExpense_Id(UUID expenseId);
    List<ExpenseSplitTbl> findByUserIdAndStatus(UUID userId, ExpenseSplitStatus status);
}
