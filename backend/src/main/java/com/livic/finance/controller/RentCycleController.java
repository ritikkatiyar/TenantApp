package com.livic.finance.controller;

import com.livic.auth.principal.UserDetailsImpl;
import com.livic.common.domain.LeaseStatus;
import com.livic.common.domain.RentCycleStatus;
import com.livic.common.exception.BusinessException;
import com.livic.common.response.ApiResponse;
import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.dto.RentCycleDTOs;
import com.livic.finance.service.interfaces.LeaseQueryService;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/rent-cycles")
@RequiredArgsConstructor
@Slf4j
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
    @PreAuthorize("@authorizationService.hasPermission(#request.propertyId, 'PROPERTY_UPDATE')")
    public ResponseEntity<ApiResponse<List<RentCycleDTOs.RentCycleResponse>>> batchGenerate(
            @Valid @RequestBody RentCycleDTOs.BatchGenerateRentCycleRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(rentCycleService.batchGenerate(request)));
    }

    @PostMapping("/batch-publish")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_UPDATE')")
    public ResponseEntity<ApiResponse<List<RentCycleDTOs.RentCycleResponse>>> batchPublish(
            @RequestParam UUID propertyId,
            @RequestParam String billingMonth
    ) {
        return ResponseEntity.ok(ApiResponse.success(rentCycleService.batchPublish(propertyId, billingMonth)));
    }

    @PostMapping("/batch-unpublish")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_UPDATE')")
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
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        log.info("API request: Record cash rent payment for RentCycle: {}", rentCycleId);
        Object amountObj = request.get("amount");
        if (amountObj == null) {
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Amount is required");
        }

        BigDecimal amount = new BigDecimal(amountObj.toString());
        String note = (String) request.get("note");
        UUID payerUserId = request.get("payerUserId") != null ? UUID.fromString(request.get("payerUserId").toString()) : null;
        UUID confirmedBy = UUID.fromString(userDetails.getId());

        return ResponseEntity.ok(ApiResponse.success(rentCycleService.recordCashPayment(rentCycleId, amount, note, payerUserId, confirmedBy)));
    }
}
