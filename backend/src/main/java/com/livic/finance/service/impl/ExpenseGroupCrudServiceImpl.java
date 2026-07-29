package com.livic.finance.service.impl;

import com.livic.common.service.impl.AbstractCrudService;
import com.livic.finance.domain.ExpenseGroupTbl;
import com.livic.finance.repository.ExpenseGroupRepository;
import com.livic.finance.service.interfaces.ExpenseGroupCrudService;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ExpenseGroupCrudServiceImpl extends AbstractCrudService<ExpenseGroupTbl, UUID, ExpenseGroupRepository> implements ExpenseGroupCrudService {

    public ExpenseGroupCrudServiceImpl(ExpenseGroupRepository repository) {
        super(repository);
    }
}
