package com.tenantliving.expensegroup.service.interfaces;

import com.tenantliving.expensegroup.domain.ExpenseGroupTbl;
import com.tenantliving.expensegroup.dto.ExpenseGroupDTOs;

import java.util.UUID;

public interface ExpenseGroupService {
    ExpenseGroupTbl create(ExpenseGroupDTOs.CreateExpenseGroupRequest request);

    ExpenseGroupTbl getById(UUID id);
}
