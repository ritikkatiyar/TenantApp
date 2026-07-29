package com.livic.finance.service.impl;

import com.livic.common.exception.BusinessException;
import com.livic.finance.domain.ExpenseTbl;
import com.livic.finance.dto.ExpenseDTOs;
import com.livic.finance.mapper.ExpenseMapper;
import com.livic.finance.repository.ExpenseRepository;
import com.livic.finance.service.interfaces.ExpenseService;
import com.livic.finance.domain.ExpenseGroupTbl;
import com.livic.finance.service.interfaces.ExpenseGroupService;
import com.livic.user.service.interfaces.UserQueryService;
import com.livic.finance.specification.ExpenseSpecifications;
import org.springframework.data.jpa.domain.Specification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.livic.finance.service.interfaces.ExpenseCrudService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseCrudService expenseCrudService;
    private final ExpenseGroupService expenseGroupService;
    private final UserQueryService userQueryService;

    @Override
    @Transactional
    public ExpenseTbl create(ExpenseDTOs.CreateExpenseRequest request) {
        ExpenseGroupTbl group = expenseGroupService.getById(request.expenseGroupId());
        userQueryService.getUserById(request.createdBy());
        ExpenseTbl expense = ExpenseMapper.toEntity(request, group);
        ExpenseTbl saved = expenseCrudService.save(expense);
        log.info("expense_created expenseId={} expenseGroupId={} createdBy={} expenseType={} totalAmount={}",
                saved.getId(), saved.getExpenseGroup().getId(), saved.getCreatedBy(), saved.getExpenseType(), saved.getTotalAmount());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseTbl getById(UUID id) {
        return expenseCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Expense not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ExpenseTbl> list(UUID expenseGroupId, String billingMonth, Pageable pageable) {
        Specification<ExpenseTbl> spec = Specification
                .where(ExpenseSpecifications.hasExpenseGroupId(expenseGroupId))
                .and(ExpenseSpecifications.hasBillingMonth(billingMonth));

        return expenseCrudService.findAll(spec, pageable);
    }
}
