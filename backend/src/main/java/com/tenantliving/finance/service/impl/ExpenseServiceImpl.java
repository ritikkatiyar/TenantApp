package com.tenantliving.finance.service.impl;

import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.finance.domain.ExpenseTbl;
import com.tenantliving.finance.dto.ExpenseDTOs;
import com.tenantliving.finance.repository.ExpenseRepository;
import com.tenantliving.finance.service.interfaces.ExpenseService;
import com.tenantliving.finance.domain.ExpenseGroupTbl;
import com.tenantliving.finance.service.interfaces.ExpenseGroupService;
import com.tenantliving.user.service.interfaces.UserQueryService;
import com.tenantliving.finance.specification.ExpenseSpecifications;
import org.springframework.data.jpa.domain.Specification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ExpenseServiceImpl implements ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseGroupService expenseGroupService;
    private final UserQueryService userQueryService;

    @Override
    @Transactional
    public ExpenseTbl create(ExpenseDTOs.CreateExpenseRequest request) {
        ExpenseGroupTbl group = expenseGroupService.getById(request.expenseGroupId());
        userQueryService.getUserById(request.createdBy());
        ExpenseTbl expense = ExpenseTbl.builder()
                .expenseGroup(group)
                .createdBy(request.createdBy())
                .totalAmount(request.totalAmount())
                .expenseType(request.expenseType())
                .description(request.description())
                .billingMonth(request.billingMonth())
                .build();
        ExpenseTbl saved = expenseRepository.save(expense);
        log.info("expense_created expenseId={} expenseGroupId={} createdBy={} expenseType={} totalAmount={}",
                saved.getId(), saved.getExpenseGroup().getId(), saved.getCreatedBy(), saved.getExpenseType(), saved.getTotalAmount());
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public ExpenseTbl getById(UUID id) {
        return expenseRepository.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Expense not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpenseTbl> list(UUID expenseGroupId, String billingMonth) {
        Specification<ExpenseTbl> spec = Specification
                .where(ExpenseSpecifications.hasExpenseGroupId(expenseGroupId))
                .and(ExpenseSpecifications.hasBillingMonth(billingMonth));

        return expenseRepository.findAll(spec);
    }
}
