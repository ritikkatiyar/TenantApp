package com.tenantliving.finance.service.impl;

import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.finance.domain.ExpenseGroupTbl;
import com.tenantliving.finance.dto.ExpenseGroupDTOs;
import com.tenantliving.finance.mapper.ExpenseGroupMapper;
import com.tenantliving.finance.service.interfaces.ExpenseGroupCrudService;
import com.tenantliving.finance.service.interfaces.ExpenseGroupService;
import com.tenantliving.property.domain.UnitTbl;
import com.tenantliving.property.service.interfaces.UnitQueryService;
import com.tenantliving.user.service.interfaces.UserQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseGroupServiceImpl implements ExpenseGroupService {

    private final ExpenseGroupCrudService expenseGroupCrudService;
    private final UnitQueryService unitQueryService;
    private final UserQueryService userQueryService;

    @Override
    @Transactional
    public ExpenseGroupTbl create(ExpenseGroupDTOs.CreateExpenseGroupRequest request) {
        UnitTbl unit = unitQueryService.getUnitById(request.unitId());
        userQueryService.getUserById(request.createdBy());
        ExpenseGroupTbl group = ExpenseGroupMapper.toEntity(request, unit);
        ExpenseGroupTbl saved = expenseGroupCrudService.save(group);
        log.info("expense_group_created expenseGroupId={} unitId={} createdBy={}",
                saved.getId(), saved.getUnit().getId(), saved.getCreatedBy());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseGroupTbl getById(UUID id) {
        return expenseGroupCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Expense group not found"));
    }
}
