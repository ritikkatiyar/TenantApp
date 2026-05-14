package com.tenantliving.expensegroup.controller;

import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.expensegroup.dto.ExpenseGroupDTOs;
import com.tenantliving.expensegroup.mapper.ExpenseGroupMapper;
import com.tenantliving.expensegroup.service.interfaces.ExpenseGroupService;
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

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/expense-groups")
@RequiredArgsConstructor
@Tag(name = "Expense Groups", description = "Roommate financial group APIs")
@SecurityRequirement(name = "bearerAuth")
public class ExpenseGroupController {

    private final ExpenseGroupService expenseGroupService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_STAFF', 'USER')")
    @Operation(
            summary = "Create expense group",
            description = "Creates an internal roommate financial group for a unit. "
                    + "This group is independent from owner rent-cycle billing."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Expense group created",
                    content = @Content(schema = @Schema(implementation = ExpenseGroupDTOs.ExpenseGroupResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failed"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Unit or creator user not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing role")
    })
    public ResponseEntity<ApiResponse<ExpenseGroupDTOs.ExpenseGroupResponse>> create(
            @Valid @RequestBody ExpenseGroupDTOs.CreateExpenseGroupRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(ExpenseGroupMapper.toResponse(expenseGroupService.create(request))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_STAFF', 'USER')")
    @Operation(
            summary = "Get expense group",
            description = "Returns a roommate financial group by UUID, including unit reference and creator."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Expense group returned",
                    content = @Content(schema = @Schema(implementation = ExpenseGroupDTOs.ExpenseGroupResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Expense group not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing role")
    })
    public ResponseEntity<ApiResponse<ExpenseGroupDTOs.ExpenseGroupResponse>> get(
            @Parameter(description = "Expense group UUID", required = true, in = ParameterIn.PATH)
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(ExpenseGroupMapper.toResponse(expenseGroupService.getById(id))));
    }
}
