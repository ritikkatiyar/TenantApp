package com.livic.finance.controller;

import com.livic.auth.principal.UserDetailsImpl;
import com.livic.common.response.ApiResponse;
import com.livic.finance.dto.ExpenseSplitDTOs;
import com.livic.finance.service.interfaces.ExpenseSplitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/splits")
@RequiredArgsConstructor
    /**
     * Expense Splits
     * Roommate split generation, dues, and settlement APIs
     */

public class ExpenseSplitController {

    private final ExpenseSplitService expenseSplitService;

    @PostMapping("/generate")
    @PreAuthorize("@authorizationService.hasPermissionByExpenseId(#request.expenseId(), 'EXPENSE_CREATE')")
        /**
     * Generate expense splits
     * Generates individual roommate obligations for one shared expense using EQUAL, PERCENTAGE, FIXED, CUSTOM, or ROTATIONAL strategy. 
     */

    
    public ResponseEntity<ApiResponse<List<ExpenseSplitDTOs.ExpenseSplitResponse>>> generate(
            @Valid @RequestBody ExpenseSplitDTOs.GenerateExpenseSplitsRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(expenseSplitService.generate(request)));
    }

    @GetMapping("/my-dues")
    @PreAuthorize("isAuthenticated()")
        /**
     * Get my pending dues
     * Returns pending roommate split obligations for the authenticated user.
     */

    
    public ResponseEntity<ApiResponse<List<ExpenseSplitDTOs.ExpenseSplitResponse>>> myDues(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        return ResponseEntity.ok(ApiResponse.success(expenseSplitService.myDues(UUID.fromString(currentUser.getId()))));
    }

    @PostMapping("/{id}/settle")
    @PreAuthorize("@authorizationService.hasPermissionByExpenseSplitId(#id, 'EXPENSE_CREATE')")
        /**
     * Settle expense split
     * Marks one roommate split obligation as SETTLED and records paidAt. 
     */

    
    public ResponseEntity<ApiResponse<ExpenseSplitDTOs.ExpenseSplitResponse>> settle(
            
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(expenseSplitService.settle(id)));
    }
}
