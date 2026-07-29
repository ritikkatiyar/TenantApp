package com.livic.finance.controller;

import com.livic.common.response.ApiResponse;
import com.livic.finance.dto.ExpenseGroupDTOs;
import com.livic.finance.mapper.ExpenseGroupMapper;
import com.livic.finance.service.interfaces.ExpenseGroupService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/groups")
@RequiredArgsConstructor
    /**
     * Expense Groups
     * Roommate financial group APIs
     */

public class ExpenseGroupController {

    private final ExpenseGroupService expenseGroupService;

    @PostMapping
    @PreAuthorize("@authorizationService.hasPermissionByUnitId(#request.unitId(), 'EXPENSE_CREATE')")
        /**
     * Create expense group
     * Creates an internal roommate financial group for a unit. 
     */

    
    public ResponseEntity<ApiResponse<ExpenseGroupDTOs.ExpenseGroupResponse>> create(
            @Valid @RequestBody ExpenseGroupDTOs.CreateExpenseGroupRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(ExpenseGroupMapper.toResponse(expenseGroupService.create(request))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@authorizationService.hasPermissionByExpenseGroupId(#id, 'PROPERTY_VIEW')")
        /**
     * Get expense group
     * Returns a roommate financial group by UUID, including unit reference and creator.
     */

    
    public ResponseEntity<ApiResponse<ExpenseGroupDTOs.ExpenseGroupResponse>> get(
            
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(ExpenseGroupMapper.toResponse(expenseGroupService.getById(id))));
    }
}
