package com.livic.finance.service.impl;

import com.livic.common.domain.ExpenseSplitStatus;
import com.livic.common.service.impl.AbstractCrudService;
import com.livic.finance.domain.ExpenseSplitTbl;
import com.livic.finance.repository.ExpenseSplitRepository;
import com.livic.finance.service.interfaces.ExpenseSplitCrudService;
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
