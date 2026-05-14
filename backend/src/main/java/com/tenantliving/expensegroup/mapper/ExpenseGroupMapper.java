package com.tenantliving.expensegroup.mapper;

import com.tenantliving.expensegroup.domain.ExpenseGroupTbl;
import com.tenantliving.expensegroup.dto.ExpenseGroupDTOs;

public final class ExpenseGroupMapper {
    private ExpenseGroupMapper() {
    }

    public static ExpenseGroupDTOs.ExpenseGroupResponse toResponse(ExpenseGroupTbl group) {
        return new ExpenseGroupDTOs.ExpenseGroupResponse(
                group.getId(),
                group.getUnit().getId(),
                group.getCreatedBy(),
                group.getName(),
                group.getCreatedAt()
        );
    }
}
