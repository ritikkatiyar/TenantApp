package com.tenantliving.finance.service.impl;

import com.tenantliving.common.domain.ExpenseSplitStatus;
import com.tenantliving.common.service.impl.AbstractCrudService;
import com.tenantliving.finance.domain.ExpenseSplitTbl;
import com.tenantliving.finance.repository.ExpenseSplitRepository;
import com.tenantliving.finance.service.interfaces.ExpenseSplitCrudService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class ExpenseSplitCrudServiceImpl extends AbstractCrudService<ExpenseSplitTbl, UUID, ExpenseSplitRepository> implements ExpenseSplitCrudService {

    public ExpenseSplitCrudServiceImpl(ExpenseSplitRepository repository) {
        super(repository);
    }

    @Override
    public List<ExpenseSplitTbl> findByExpense_Id(UUID expenseId) {
        return repository.findByExpense_Id(expenseId);
    }

    @Override
    public List<ExpenseSplitTbl> findByUserIdAndStatus(UUID userId, ExpenseSplitStatus status) {
        return repository.findByUserIdAndStatus(userId, status);
    }
}
