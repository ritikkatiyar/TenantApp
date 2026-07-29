package com.livic.finance.service.interfaces;

import com.livic.finance.domain.ExpenseGroupTbl;
import com.livic.finance.dto.ExpenseGroupDTOs;

import java.util.UUID;

public interface ExpenseGroupService {
    ExpenseGroupTbl create(ExpenseGroupDTOs.CreateExpenseGroupRequest request);

    ExpenseGroupTbl getById(UUID id);
}
