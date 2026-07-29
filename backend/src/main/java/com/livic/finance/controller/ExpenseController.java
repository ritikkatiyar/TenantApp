package com.livic.finance.controller;

import com.livic.common.response.ApiResponse;
import com.livic.finance.dto.ExpenseDTOs;
import com.livic.finance.mapper.ExpenseMapper;
import com.livic.finance.service.interfaces.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/expenses")
@RequiredArgsConstructor
    /**
     * Expenses
     * Shared roommate expense entry APIs
     */

public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    @PreAuthorize("@authorizationService.hasPermissionByExpenseGroupId(#request.expenseGroupId(), 'EXPENSE_CREATE')")
        /**
     * Create shared expense
     * Creates a roommate shared expense entry, such as electricity, WiFi, groceries, or internal rent tracking. 
     */

    
    public ResponseEntity<ApiResponse<ExpenseDTOs.ExpenseResponse>> create(
            @Valid @RequestBody ExpenseDTOs.CreateExpenseRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(ExpenseMapper.toResponse(expenseService.create(request))));
    }

    @GetMapping
    @PreAuthorize("@authorizationService.hasPermissionByExpenseGroupId(#expenseGroupId, 'PROPERTY_VIEW')")
        /**
     * List shared expenses
     * Lists roommate shared expenses. Optional query params filter by expenseGroupId and billingMonth.
     */

    
    public ResponseEntity<ApiResponse<Page<ExpenseDTOs.ExpenseResponse>>> list(
            
            @RequestParam(required = true) UUID expenseGroupId,
            
            @RequestParam(required = false) String billingMonth,
            
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC, size = 30) Pageable pageable
    ) {
        Page<ExpenseDTOs.ExpenseResponse> responses = expenseService.list(expenseGroupId, billingMonth, pageable)
                .map(ExpenseMapper::toResponse);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }
}
