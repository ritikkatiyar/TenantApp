package com.tenantliving.finance.mapper;

import com.tenantliving.finance.domain.ExpenseGroupTbl;
import com.tenantliving.finance.dto.ExpenseGroupDTOs;
import com.tenantliving.property.domain.UnitTbl;

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

    public static ExpenseGroupTbl toEntity(ExpenseGroupDTOs.CreateExpenseGroupRequest request, UnitTbl unit) {
        return ExpenseGroupTbl.builder()
                .unit(unit)
                .createdBy(request.createdBy())
                .name(request.name())
                .build();
    }
}
