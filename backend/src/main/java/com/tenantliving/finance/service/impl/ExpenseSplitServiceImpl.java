package com.tenantliving.finance.service.impl;

import com.tenantliving.common.domain.ExpenseSplitStatus;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.finance.domain.ExpenseTbl;
import com.tenantliving.finance.service.interfaces.ExpenseService;
import com.tenantliving.finance.domain.ExpenseSplitTbl;
import com.tenantliving.finance.dto.ExpenseSplitDTOs;
import com.tenantliving.finance.mapper.ExpenseSplitMapper;
import com.tenantliving.finance.service.interfaces.ExpenseSplitCrudService;
import com.tenantliving.finance.service.interfaces.ExpenseSplitService;
import com.tenantliving.finance.service.strategy.ExpenseSplitCalculationStrategy;
import com.tenantliving.user.service.interfaces.UserQueryService;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@Slf4j
public class ExpenseSplitServiceImpl implements ExpenseSplitService {

    private final ExpenseSplitCrudService expenseSplitCrudService;
    private final ExpenseService expenseService;
    private final UserQueryService userQueryService;
    private final Map<com.tenantliving.common.domain.ExpenseSplitType, ExpenseSplitCalculationStrategy> strategies;

    public ExpenseSplitServiceImpl(
            ExpenseSplitCrudService expenseSplitCrudService,
            ExpenseService expenseService,
            UserQueryService userQueryService,
            List<ExpenseSplitCalculationStrategy> strategies
    ) {
        this.expenseSplitCrudService = expenseSplitCrudService;
        this.expenseService = expenseService;
        this.userQueryService = userQueryService;
        this.strategies = new EnumMap<>(com.tenantliving.common.domain.ExpenseSplitType.class);
        strategies.forEach(strategy -> strategy.supportedTypes()
                .forEach(type -> this.strategies.put(type, strategy)));
    }

    @Override
    @Transactional
    public List<ExpenseSplitDTOs.ExpenseSplitResponse> generate(ExpenseSplitDTOs.GenerateExpenseSplitsRequest request) {
        ExpenseTbl expense = expenseService.getById(request.expenseId());
        if (!expenseSplitCrudService.findByExpense_Id(request.expenseId()).isEmpty()) {
            throw new BusinessException(HttpStatus.CONFLICT, "Expense splits already exist for this expense");
        }

        validateParticipants(request.participants());
        ExpenseSplitCalculationStrategy strategy = strategies.get(request.splitType());
        if (strategy == null) {
            throw new BusinessException("Unsupported split type");
        }
        List<ExpenseSplitTbl> splits = strategy.calculate(expense, request.splitType(), request.participants());

        List<ExpenseSplitTbl> savedSplits = expenseSplitCrudService.saveAll(splits);
        log.info("expense_splits_generated expenseId={} splitType={} splitCount={}",
                expense.getId(), request.splitType(), savedSplits.size());
        return savedSplits
                .stream()
                .map(ExpenseSplitMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExpenseSplitDTOs.ExpenseSplitResponse> myDues(UUID userId) {
        return expenseSplitCrudService.findByUserIdAndStatus(userId, ExpenseSplitStatus.PENDING)
                .stream()
                .map(ExpenseSplitMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ExpenseSplitDTOs.ExpenseSplitResponse settle(UUID id) {
        ExpenseSplitTbl split = expenseSplitCrudService.findById(id)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Expense split not found"));
        split.setStatus(ExpenseSplitStatus.SETTLED);
        split.setPaidAt(LocalDateTime.now());
        ExpenseSplitTbl saved = expenseSplitCrudService.save(split);
        log.info("expense_split_settled expenseSplitId={} expenseId={} userId={}",
                saved.getId(), saved.getExpense().getId(), saved.getUserId());
        return ExpenseSplitMapper.toResponse(saved);
    }

    private void validateParticipants(List<ExpenseSplitDTOs.ParticipantRequest> participants) {
        List<UUID> userIds = participants.stream().map(ExpenseSplitDTOs.ParticipantRequest::userId).distinct().toList();
        Map<UUID, com.tenantliving.user.domain.UserTbl> users = userQueryService.getUsersByIds(userIds);
        if (users.size() != userIds.size()) {
            throw new BusinessException(HttpStatus.NOT_FOUND, "One or more participants not found");
        }
    }
}
