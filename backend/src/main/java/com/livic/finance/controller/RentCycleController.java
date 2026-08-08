package com.livic.finance.controller;

import com.livic.auth.principal.UserDetailsImpl;
import com.livic.common.domain.RentCycleStatus;
import com.livic.common.response.ApiResponse;
import com.livic.finance.dto.RentCycleDTOs;
import com.livic.finance.service.interfaces.RentCycleService;
import com.livic.payment.dto.PaymentInitiationResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/rent-cycles")
@RequiredArgsConstructor
@Slf4j
public class RentCycleController {

    private final RentCycleService rentCycleService;

    @PostMapping("/generate")
    @PreAuthorize("@authorizationService.hasPermissionByLeaseId(#request.leaseId, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<RentCycleDTOs.RentCycleResponse>> generate(
            @Valid @RequestBody RentCycleDTOs.GenerateRentCycleRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(rentCycleService.generate(request)));
    }

    @PostMapping("/batch-generate")
    @PreAuthorize("@authorizationService.hasPermission(#request.propertyId, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<List<RentCycleDTOs.RentCycleResponse>>> batchGenerate(
            @Valid @RequestBody RentCycleDTOs.BatchGenerateRentCycleRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(rentCycleService.batchGenerate(request)));
    }

    @PostMapping("/{id}/publish")
    @PreAuthorize("@authorizationService.hasPermissionByRentCycleId(#id, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<RentCycleDTOs.RentCycleResponse>> publish(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.publish(id)));
    }

    @PostMapping("/{id}/unpublish")
    @PreAuthorize("@authorizationService.hasPermissionByRentCycleId(#id, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<RentCycleDTOs.RentCycleResponse>> unpublish(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.unpublish(id)));
    }

    @PostMapping("/batch-publish")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<List<RentCycleDTOs.RentCycleResponse>>> batchPublish(
            @RequestParam UUID propertyId,
            @RequestParam String billingMonth
    ) {
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.batchPublish(propertyId, billingMonth)));
    }

    @PostMapping("/batch-unpublish")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<List<RentCycleDTOs.RentCycleResponse>>> batchUnpublish(
            @RequestParam UUID propertyId,
            @RequestParam String billingMonth
    ) {
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.batchUnpublish(propertyId, billingMonth)));
    }

    @GetMapping("/pre-flight")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<RentCycleDTOs.PreFlightChecklistResponse>> getPreFlightChecklist(
            @RequestParam UUID propertyId,
            @RequestParam String billingMonth
    ) {
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.getPreFlightChecklist(propertyId, billingMonth)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<RentCycleDTOs.RentCycleListResponse>> list(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestParam(required = false) UUID propertyId,
            @RequestParam(required = false) UUID leaseId,
            @RequestParam(required = false) String billingMonth,
            @RequestParam(required = false) RentCycleStatus status,
            @PageableDefault(sort = "dueDate", direction = Sort.Direction.DESC, size = 20) Pageable pageable
    ) {
        UUID currentUserId = currentUser != null ? UUID.fromString(currentUser.getId()) : null;
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.list(currentUserId, propertyId, leaseId, billingMonth, status, pageable)));
    }

    @PostMapping("/{id}/mark-paid")
    public ResponseEntity<ApiResponse<RentCycleDTOs.RentCycleResponse>> markPaid(
            @PathVariable UUID id
    ) {
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.markPaid(id)));
    }

    @PostMapping("/{rentCycleId}/online")
    @PreAuthorize("@authorizationService.hasPermissionByRentCycleId(#rentCycleId, 'LEASE_VIEW_OWN')")
    public ResponseEntity<ApiResponse<PaymentInitiationResponse>> initiateRentOnlinePayment(
            @PathVariable UUID rentCycleId,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        log.info("API request: Initiate online rent payment for RentCycle: {}", rentCycleId);
        UUID payerUserId = UUID.fromString(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.initiateOnlinePayment(rentCycleId, payerUserId)));
    }

    @PostMapping("/{rentCycleId}/cash")
    @PreAuthorize("@authorizationService.hasPermissionByRentCycleId(#rentCycleId, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<PaymentInitiationResponse>> recordRentCashPayment(
            @PathVariable UUID rentCycleId,
            @Valid @RequestBody RentCycleDTOs.RecordRentCashPaymentRequest request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        log.info("API request: Record cash rent payment for RentCycle: {}", rentCycleId);
        UUID confirmedBy = UUID.fromString(userDetails.getId());
        return ResponseEntity.ok(ApiResponse.success(
                rentCycleService.recordCashPayment(rentCycleId, request.amount(), request.note(), request.payerUserId(), confirmedBy)
        ));
    }
}
