package com.tenantliving.expensesplit.controller;

import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.expensesplit.dto.ExpenseSplitDTOs;
import com.tenantliving.expensesplit.service.interfaces.ExpenseSplitService;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/expense-splits")
@RequiredArgsConstructor
@Tag(name = "Expense Splits", description = "Roommate split generation, dues, and settlement APIs")
@SecurityRequirement(name = "bearerAuth")
public class ExpenseSplitController {

    private final ExpenseSplitService expenseSplitService;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_STAFF', 'USER')")
    @Operation(
            summary = "Generate expense splits",
            description = "Generates individual roommate obligations for one shared expense using EQUAL, PERCENTAGE, FIXED, CUSTOM, or ROTATIONAL strategy. "
                    + "Generated splits are internal settlement records and do not affect owner rent cycles."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Expense splits generated"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation or split total mismatch"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Expense or participant user not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Splits already exist for this expense"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing role")
    })
    public ResponseEntity<ApiResponse<List<ExpenseSplitDTOs.ExpenseSplitResponse>>> generate(
            @Valid @RequestBody ExpenseSplitDTOs.GenerateExpenseSplitsRequest request
    ) {
        return ResponseEntity.ok(ApiResponse.success(expenseSplitService.generate(request)));
    }

    @GetMapping("/my-dues")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_STAFF', 'USER')")
    @Operation(
            summary = "Get my pending dues",
            description = "Returns pending roommate split obligations for the authenticated user."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Pending dues returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Missing or invalid token"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing role")
    })
    public ResponseEntity<ApiResponse<List<ExpenseSplitDTOs.ExpenseSplitResponse>>> myDues(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        return ResponseEntity.ok(ApiResponse.success(expenseSplitService.myDues(UUID.fromString(currentUser.getId()))));
    }

    @PostMapping("/{id}/settle")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_STAFF', 'USER')")
    @Operation(
            summary = "Settle expense split",
            description = "Marks one roommate split obligation as SETTLED and records paidAt. "
                    + "This is independent from owner rent-cycle payment status."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Expense split settled",
                    content = @Content(schema = @Schema(implementation = ExpenseSplitDTOs.ExpenseSplitResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Expense split not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing role")
    })
    public ResponseEntity<ApiResponse<ExpenseSplitDTOs.ExpenseSplitResponse>> settle(
            @Parameter(description = "Expense split UUID", required = true, in = ParameterIn.PATH)
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(expenseSplitService.settle(id)));
    }
}
