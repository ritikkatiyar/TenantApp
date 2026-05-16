package com.tenantliving.finance.mapper;

import com.tenantliving.finance.domain.ExpenseGroupTbl;
import com.tenantliving.finance.dto.ExpenseGroupDTOs;

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
