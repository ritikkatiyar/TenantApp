package com.tenantliving.finance.service.impl;

import com.tenantliving.common.service.impl.AbstractCrudService;
import com.tenantliving.finance.domain.ExpenseGroupTbl;
import com.tenantliving.finance.repository.ExpenseGroupRepository;
import com.tenantliving.finance.service.interfaces.ExpenseGroupCrudService;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class ExpenseGroupCrudServiceImpl extends AbstractCrudService<ExpenseGroupTbl, UUID, ExpenseGroupRepository> implements ExpenseGroupCrudService {

    public ExpenseGroupCrudServiceImpl(ExpenseGroupRepository repository) {
        super(repository);
    }
}
