package com.tenantliving.finance.controller;

import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.finance.dto.LeaseDTOs;
import com.tenantliving.finance.mapper.LeaseMapper;
import com.tenantliving.finance.service.interfaces.LeaseService;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/leases")
@RequiredArgsConstructor
@Tag(name = "Leases", description = "Owner billing contract and occupancy APIs")
@SecurityRequirement(name = "bearerAuth")
public class LeaseController {

    private final LeaseService leaseService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_STAFF')")
    @Operation(
            summary = "Create lease",
            description = "Creates an owner-level rent agreement between a tenant user and a unit. "
                    + "This does not create roommate expense splits."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "201", description = "Lease created",
                    content = @Content(schema = @Schema(implementation = LeaseDTOs.LeaseResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failed"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "User or unit not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing management role")
    })
    public ResponseEntity<ApiResponse<LeaseDTOs.LeaseResponse>> create(
            @Valid @RequestBody LeaseDTOs.CreateLeaseRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        UUID assignedByUserId = currentUser != null ? UUID.fromString(currentUser.getId()) : null;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(LeaseMapper.toResponse(leaseService.createLease(request, assignedByUserId))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_STAFF', 'USER')")
    @Operation(
            summary = "Get lease",
            description = "Returns a lease by UUID, including owner-level rent amount, deposit, dates, status, and unit reference."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lease returned",
                    content = @Content(schema = @Schema(implementation = LeaseDTOs.LeaseResponse.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Lease not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing role")
    })
    public ResponseEntity<ApiResponse<LeaseDTOs.LeaseResponse>> get(
            @Parameter(description = "Lease UUID", required = true, in = ParameterIn.PATH)
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(LeaseMapper.toResponse(leaseService.getLeaseById(id))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_STAFF')")
    @Operation(
            summary = "Delete lease",
            description = "Removes/terminates a lease by UUID."
    )
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "Lease deleted"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "404", description = "Lease not found"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Missing role")
    })
    public ResponseEntity<ApiResponse<Void>> deleteLease(
            @Parameter(description = "Lease UUID", required = true, in = ParameterIn.PATH)
            @PathVariable UUID id
    ) {
        leaseService.deleteLease(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
