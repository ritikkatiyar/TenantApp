package com.tenantliving.finance.controller;

import com.tenantliving.common.domain.RentCycleStatus;
import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.finance.dto.RentCycleDTOs;
import com.tenantliving.finance.service.interfaces.RentCycleService;
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
    /**
     * Rent Cycles
     * Owner billing cycle generation and payment APIs
     */

public class RentCycleController {

    private final RentCycleService rentCycleService;

    @PostMapping("/generate")
    @PreAuthorize("@authorizationService.hasPermissionByLeaseId(#request.leaseId, 'LEASE_UPDATE')")
        /**
     * Generate rent cycle
     * Creates one monthly owner billing cycle for a lease. 
     */

    
    public ResponseEntity<ApiResponse<RentCycleDTOs.RentCycleResponse>> generate(
            @Valid @RequestBody RentCycleDTOs.GenerateRentCycleRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(rentCycleService.generate(request)));
    }

    @PostMapping("/batch-generate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN') or @authorizationService.hasPermission(#request.propertyId, 'PROPERTY_UPDATE')")
    /**
     * Batch generate rent cycles
     * Generates rent invoices for all active leases in a property for a given month.
     */
    public ResponseEntity<ApiResponse<List<RentCycleDTOs.RentCycleResponse>>> batchGenerate(
            @Valid @RequestBody RentCycleDTOs.BatchGenerateRentCycleRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(rentCycleService.batchGenerate(request)));
    }

    @PostMapping("/batch-publish")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN') or @authorizationService.hasPermission(#propertyId, 'PROPERTY_UPDATE')")
    /**
     * Batch publish rent cycles
     * Publishes all PENDING rent cycles for a property and billing month.
     */
    public ResponseEntity<ApiResponse<List<RentCycleDTOs.RentCycleResponse>>> batchPublish(
            @RequestParam UUID propertyId,
            @RequestParam String billingMonth
    ) {
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.batchPublish(propertyId, billingMonth)));
    }

    @PostMapping("/batch-unpublish")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN') or @authorizationService.hasPermission(#propertyId, 'PROPERTY_UPDATE')")
    /**
     * Batch unpublish rent cycles
     * Reverts all PUBLISHED rent cycles for a property and billing month back to PENDING.
     */
    public ResponseEntity<ApiResponse<List<RentCycleDTOs.RentCycleResponse>>> batchUnpublish(
            @RequestParam UUID propertyId,
            @RequestParam String billingMonth
    ) {
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.batchUnpublish(propertyId, billingMonth)));
    }

    @GetMapping("/pre-flight")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN') or @authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    /**
     * Get pre-flight checklist
     * Returns statistics for the generation readiness of a property for a given month.
     */
    public ResponseEntity<ApiResponse<RentCycleDTOs.PreFlightChecklistResponse>> getPreFlightChecklist(
            @RequestParam UUID propertyId,
            @RequestParam String billingMonth
    ) {
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.getPreFlightChecklist(propertyId, billingMonth)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN') or @authorizationService.hasPermissionByLeaseId(#leaseId, 'LEASE_VIEW') or @authorizationService.hasPermissionByLeaseId(#leaseId, 'LEASE_VIEW_OWN')")
        /**
     * List rent cycles
     * Lists owner billing cycles. Optional query params filter by leaseId, billingMonth, and status.
     */

    
    public ResponseEntity<ApiResponse<List<RentCycleDTOs.RentCycleResponse>>> list(
            
            @RequestParam(required = false) UUID leaseId,
            
            @RequestParam(required = false) String billingMonth,
            
            @RequestParam(required = false) RentCycleStatus status
    ) {
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.list(leaseId, billingMonth, status)));
    }

    @PostMapping("/{id}/mark-paid")
    @PreAuthorize("@authorizationService.hasPermissionByRentCycleId(#id, 'LEASE_UPDATE')")
        /**
     * Mark rent cycle paid
     * Marks an owner billing cycle as PAID and records paidAt. 
     */

    
    public ResponseEntity<ApiResponse<RentCycleDTOs.RentCycleResponse>> markPaid(
            
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.markPaid(id)));
    }
}
