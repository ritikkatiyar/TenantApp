package com.tenantliving.finance.service.impl;

import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.finance.domain.ExpenseGroupTbl;
import com.tenantliving.finance.dto.ExpenseGroupDTOs;
import com.tenantliving.finance.repository.ExpenseGroupRepository;
import com.tenantliving.finance.service.interfaces.ExpenseGroupService;
import com.tenantliving.property.domain.UnitTbl;
import com.tenantliving.property.service.interfaces.UnitService;
import com.tenantliving.user.service.interfaces.UserService;
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

    private final ExpenseGroupRepository expenseGroupRepository;
    private final UnitService unitService;
    private final UserService userService;

    @Override
    @Transactional
    public ExpenseGroupTbl create(ExpenseGroupDTOs.CreateExpenseGroupRequest request) {
        UnitTbl unit = unitService.getUnitById(request.unitId());
        userService.getUserById(request.createdBy());
        ExpenseGroupTbl group = ExpenseGroupTbl.builder()
                .unit(unit)
                .createdBy(request.createdBy())
                .name(request.name())
                .build();
        ExpenseGroupTbl saved = expenseGroupRepository.save(group);
        log.info("expense_group_created expenseGroupId={} unitId={} createdBy={}",
                saved.getId(), saved.getUnit().getId(), saved.getCreatedBy());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseGroupTbl getById(UUID id) {
        return expenseGroupRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Expense group not found"));
    }
}
