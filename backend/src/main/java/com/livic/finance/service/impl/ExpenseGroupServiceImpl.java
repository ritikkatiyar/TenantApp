package com.livic.finance.service.impl;

import com.livic.common.exception.BusinessException;
import com.livic.finance.domain.ExpenseGroupTbl;
import com.livic.finance.dto.ExpenseGroupDTOs;
import com.livic.finance.mapper.ExpenseGroupMapper;
import com.livic.finance.service.interfaces.ExpenseGroupCrudService;
import com.livic.finance.service.interfaces.ExpenseGroupService;
import com.livic.property.domain.UnitTbl;
import com.livic.property.service.interfaces.UnitQueryService;
import com.livic.user.service.interfaces.UserQueryService;
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
