package com.tenantliving.finance.controller;

import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.common.domain.LeaseStatus;
import com.tenantliving.common.domain.RentCycleStatus;
import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.dto.RentCycleDTOs;
import com.tenantliving.finance.service.interfaces.LeaseQueryService;
import com.tenantliving.finance.service.interfaces.RentCycleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/rent-cycles")
@RequiredArgsConstructor
public class RentCycleController {

    private final RentCycleService rentCycleService;
    private final LeaseQueryService leaseQueryService;

    @PostMapping("/generate")
    @PreAuthorize("@authorizationService.hasPermissionByLeaseId(#request.leaseId, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<RentCycleDTOs.RentCycleResponse>> generate(
            @Valid @RequestBody RentCycleDTOs.GenerateRentCycleRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(rentCycleService.generate(request)));
    }

    @PostMapping("/batch-generate")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN') or @authorizationService.hasPermission(#request.propertyId, 'PROPERTY_UPDATE')")
    public ResponseEntity<ApiResponse<List<RentCycleDTOs.RentCycleResponse>>> batchGenerate(
            @Valid @RequestBody RentCycleDTOs.BatchGenerateRentCycleRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(rentCycleService.batchGenerate(request)));
    }

    @PostMapping("/batch-publish")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN') or @authorizationService.hasPermission(#propertyId, 'PROPERTY_UPDATE')")
    public ResponseEntity<ApiResponse<List<RentCycleDTOs.RentCycleResponse>>> batchPublish(
            @RequestParam UUID propertyId,
            @RequestParam String billingMonth
    ) {
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.batchPublish(propertyId, billingMonth)));
    }

    @PostMapping("/batch-unpublish")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN') or @authorizationService.hasPermission(#propertyId, 'PROPERTY_UPDATE')")
    public ResponseEntity<ApiResponse<List<RentCycleDTOs.RentCycleResponse>>> batchUnpublish(
            @RequestParam UUID propertyId,
            @RequestParam String billingMonth
    ) {
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.batchUnpublish(propertyId, billingMonth)));
    }

    @GetMapping("/pre-flight")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN') or @authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<RentCycleDTOs.PreFlightChecklistResponse>> getPreFlightChecklist(
            @RequestParam UUID propertyId,
            @RequestParam String billingMonth
    ) {
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.getPreFlightChecklist(propertyId, billingMonth)));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<RentCycleDTOs.RentCycleResponse>>> list(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam(required = false) UUID leaseId,
            @RequestParam(required = false) String billingMonth,
            @RequestParam(required = false) RentCycleStatus status,
            @PageableDefault(sort = "dueDate", direction = Sort.Direction.DESC, size = 20) Pageable pageable
    ) {
        if (leaseId == null && currentUser != null) {
            UUID currentUserId = UUID.fromString(currentUser.getId());
            Optional<LeaseTbl> activeLease = leaseQueryService.findByUserIdAndStatus(currentUserId, LeaseStatus.ACTIVE);
            if (activeLease.isPresent()) {
                leaseId = activeLease.get().getId();
            }
        }
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.list(leaseId, billingMonth, status, pageable)));
    }

    @PostMapping("/{id}/mark-paid")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<RentCycleDTOs.RentCycleResponse>> markPaid(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.markPaid(id)));
    }
}
