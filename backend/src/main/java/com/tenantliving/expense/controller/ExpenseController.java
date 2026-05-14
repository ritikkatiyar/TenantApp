package com.tenantliving.expense.controller;

import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.expense.dto.ExpenseDTOs;
import com.tenantliving.expense.mapper.ExpenseMapper;
import com.tenantliving.expense.service.interfaces.ExpenseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/expenses")
@RequiredArgsConstructor
@Tag(name = "Expenses", description = "Shared roommate expense entry APIs")
@SecurityRequirement(name = "bearerAuth")
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_STAFF', 'USER')")
    @Operation(
            summary = "Create shared expense",
            description = "Creates a roommate shared expense entry, such as electricity, WiFi, groceries, or internal rent tracking. "
                    + "Creating an expense does not affect owner rent cycles."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Expense created",
                    content = @Content(schema = @Schema(implementation = ExpenseDTOs.ExpenseResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failed"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Expense group or creator user not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing role")
    })
    public ResponseEntity<ApiResponse<ExpenseDTOs.ExpenseResponse>> create(
            @Valid @RequestBody ExpenseDTOs.CreateExpenseRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(ExpenseMapper.toResponse(expenseService.create(request))));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_STAFF', 'USER')")
    @Operation(
            summary = "List shared expenses",
            description = "Lists roommate shared expenses. Optional query params filter by expenseGroupId and billingMonth."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Expenses returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing role")
    })
    public ResponseEntity<ApiResponse<List<ExpenseDTOs.ExpenseResponse>>> list(
            @Parameter(description = "Optional expense group UUID filter", in = ParameterIn.QUERY)
            @RequestParam(required = false) UUID expenseGroupId,
            @Parameter(description = "Optional billing month filter in yyyy-MM format", example = "2026-05", in = ParameterIn.QUERY)
            @RequestParam(required = false) String billingMonth
    ) {
        return ResponseEntity.ok(ApiResponse.success(expenseService.list(expenseGroupId, billingMonth)
                .stream()
                .map(ExpenseMapper::toResponse)
                .toList()));
    }
}
