package com.tenantliving.finance.controller;

import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.finance.dto.LeaseDTOs;
import com.tenantliving.finance.mapper.LeaseMapper;
import com.tenantliving.finance.service.interfaces.LeaseService;
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
    /**
     * Leases
     * Owner billing contract and occupancy APIs
     */

public class LeaseController {

    private final LeaseService leaseService;

    @PostMapping
    @PreAuthorize("@authorizationService.hasPermissionByUnitId(#request.unitId, 'LEASE_CREATE')")
        /**
     * Create lease
     * Creates an owner-level rent agreement between a tenant user and a unit. 
     */

    
    public ResponseEntity<ApiResponse<LeaseDTOs.LeaseResponse>> create(
            @Valid @RequestBody LeaseDTOs.CreateLeaseRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        UUID assignedByUserId = currentUser != null ? UUID.fromString(currentUser.getId()) : null;
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(LeaseMapper.toResponse(leaseService.createLease(request, assignedByUserId))));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@authorizationService.hasPermissionByLeaseId(#id, 'LEASE_VIEW') or @authorizationService.hasPermissionByLeaseId(#id, 'LEASE_VIEW_OWN')")
        /**
     * Get lease
     * Returns a lease by UUID, including owner-level rent amount, deposit, dates, status, and unit reference.
     */

    
    public ResponseEntity<ApiResponse<LeaseDTOs.LeaseResponse>> get(
            
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(LeaseMapper.toResponse(leaseService.getLeaseById(id))));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@authorizationService.hasPermissionByLeaseId(#id, 'LEASE_UPDATE')")
        /**
     * Delete lease
     * Removes/terminates a lease by UUID.
     */

    
    public ResponseEntity<ApiResponse<Void>> deleteLease(
            
            @PathVariable UUID id
    ) {
        leaseService.deleteLease(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
