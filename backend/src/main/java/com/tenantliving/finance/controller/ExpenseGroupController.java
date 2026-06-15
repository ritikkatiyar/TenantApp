package com.tenantliving.finance.controller;

import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.finance.dto.ExpenseGroupDTOs;
import com.tenantliving.finance.mapper.ExpenseGroupMapper;
import com.tenantliving.finance.service.interfaces.ExpenseGroupService;
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
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
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
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'USER')")
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
