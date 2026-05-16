package com.tenantliving.finance.controller;

import com.tenantliving.common.domain.RentCycleStatus;
import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.finance.dto.RentCycleDTOs;
import com.tenantliving.finance.service.interfaces.RentCycleService;
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
@RequestMapping("/api/v1/finance/rent-cycles")
@RequiredArgsConstructor
@Tag(name = "Rent Cycles", description = "Owner billing cycle generation and payment APIs")
@SecurityRequirement(name = "bearerAuth")
public class RentCycleController {

    private final RentCycleService rentCycleService;

    @PostMapping("/generate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_STAFF')")
    @Operation(
            summary = "Generate rent cycle",
            description = "Creates one monthly owner billing cycle for a lease. "
                    + "Base rent comes from lease rentAmount; optional charges adjust only owner billing totals."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Rent cycle generated",
                    content = @Content(schema = @Schema(implementation = RentCycleDTOs.RentCycleResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failed"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Lease not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "409", description = "Cycle already exists for lease and month")
    })
    public ResponseEntity<ApiResponse<RentCycleDTOs.RentCycleResponse>> generate(
            @Valid @RequestBody RentCycleDTOs.GenerateRentCycleRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(rentCycleService.generate(request)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_STAFF', 'USER')")
    @Operation(
            summary = "List rent cycles",
            description = "Lists owner billing cycles. Optional query params filter by leaseId, billingMonth, and status."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Rent cycles returned"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing role")
    })
    public ResponseEntity<ApiResponse<List<RentCycleDTOs.RentCycleResponse>>> list(
            @Parameter(description = "Optional lease UUID filter", in = ParameterIn.QUERY)
            @RequestParam(required = false) UUID leaseId,
            @Parameter(description = "Optional billing month filter in yyyy-MM format", example = "2026-05", in = ParameterIn.QUERY)
            @RequestParam(required = false) String billingMonth,
            @Parameter(description = "Optional status filter", in = ParameterIn.QUERY)
            @RequestParam(required = false) RentCycleStatus status
    ) {
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.list(leaseId, billingMonth, status)));
    }

    @PostMapping("/{id}/mark-paid")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_STAFF')")
    @Operation(
            summary = "Mark rent cycle paid",
            description = "Marks an owner billing cycle as PAID and records paidAt. "
                    + "This does not settle roommate expense splits."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Rent cycle marked paid",
                    content = @Content(schema = @Schema(implementation = RentCycleDTOs.RentCycleResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Rent cycle not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing management role")
    })
    public ResponseEntity<ApiResponse<RentCycleDTOs.RentCycleResponse>> markPaid(
            @Parameter(description = "Rent cycle UUID", required = true, in = ParameterIn.PATH)
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.markPaid(id)));
    }
}
