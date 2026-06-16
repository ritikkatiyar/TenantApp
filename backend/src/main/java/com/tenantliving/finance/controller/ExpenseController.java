package com.tenantliving.finance.controller;

import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.finance.dto.ExpenseDTOs;
import com.tenantliving.finance.mapper.ExpenseMapper;
import com.tenantliving.finance.service.interfaces.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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

    
    public ResponseEntity<ApiResponse<List<ExpenseDTOs.ExpenseResponse>>> list(
            
            @RequestParam(required = true) UUID expenseGroupId,
            
            @RequestParam(required = false) String billingMonth
    ) {
        return ResponseEntity.ok(ApiResponse.success(expenseService.list(expenseGroupId, billingMonth)
                .stream()
                .map(ExpenseMapper::toResponse)
                .toList()));
    }
}
