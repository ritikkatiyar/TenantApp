package com.livic.finance.service.impl;

import com.livic.common.service.impl.AbstractCrudService;
import com.livic.finance.domain.ExpenseTbl;
import com.livic.finance.repository.ExpenseRepository;
import com.livic.finance.service.interfaces.ExpenseCrudService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class ExpenseCrudServiceImpl extends AbstractCrudService<ExpenseTbl, UUID, ExpenseRepository> implements ExpenseCrudService {

    public ExpenseCrudServiceImpl(ExpenseRepository expenseRepository) {
        super(expenseRepository);
    }

    @Override
    public List<ExpenseTbl> findByExpenseGroup_Id(UUID expenseGroupId) {
        return repository.findByExpenseGroup_Id(expenseGroupId);
    }

    @Override
    public List<ExpenseTbl> findByBillingMonth(String billingMonth) {
        return repository.findByBillingMonth(billingMonth);
    }

    @Override
    public Page<ExpenseTbl> findAll(Specification<ExpenseTbl> spec, Pageable pageable) {
        return repository.findAll(spec, pageable);
    }

    @Override
    public List<ExpenseTbl> findAll(Specification<ExpenseTbl> spec) {
        return repository.findAll(spec);
    }
}
