package com.tenantliving.finance.service.interfaces;

import com.tenantliving.finance.domain.ExpenseGroupTbl;
import com.tenantliving.finance.dto.ExpenseGroupDTOs;

import java.util.UUID;

public interface ExpenseGroupService {
    ExpenseGroupTbl create(ExpenseGroupDTOs.CreateExpenseGroupRequest request);

    ExpenseGroupTbl getById(UUID id);
}
