package com.tenantliving.finance.service.interfaces;

import com.tenantliving.common.domain.ExpenseSplitStatus;
import com.tenantliving.finance.domain.ExpenseSplitTbl;
import com.tenantliving.common.service.interfaces.CrudService;

import java.util.List;
import java.util.UUID;

public interface ExpenseSplitCrudService extends CrudService<ExpenseSplitTbl, UUID> {
    List<ExpenseSplitTbl> findByExpense_Id(UUID expenseId);
    List<ExpenseSplitTbl> findByUserIdAndStatus(UUID userId, ExpenseSplitStatus status);
}
