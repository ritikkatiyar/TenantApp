package com.livic.inventory.controller;

import com.livic.auth.principal.UserDetailsImpl;
import com.livic.common.response.ApiResponse;
import com.livic.inventory.dto.InventoryDTOs;
import com.livic.inventory.service.interfaces.LeaseInventoryAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/inventory")
@RequiredArgsConstructor
public class LeaseInventoryAssignmentController {

    private final LeaseInventoryAssignmentService assignmentService;

    @PostMapping("/leases/{leaseId}/assignments")
    @PreAuthorize("@authorizationService.hasPermissionByLeaseId(#leaseId, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<List<InventoryDTOs.AssignmentItemResponse>>> createAssignments(
            @PathVariable UUID leaseId,
            @Valid @RequestBody InventoryDTOs.CreateAssignmentRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        List<InventoryDTOs.AssignmentItemResponse> response = assignmentService.createAssignments(leaseId, request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping("/leases/{leaseId}/assignments")
    @PreAuthorize("@authorizationService.hasPermissionByLeaseId(#leaseId, 'LEASE_VIEW') or @authorizationService.hasPermissionByLeaseId(#leaseId, 'LEASE_VIEW_OWN')")
    public ResponseEntity<ApiResponse<List<InventoryDTOs.AssignmentItemResponse>>> getAssignments(
            @PathVariable UUID leaseId) {
        List<InventoryDTOs.AssignmentItemResponse> response = assignmentService.getAssignmentsForLease(leaseId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/leases/{leaseId}/move-out-checklist")
    @PreAuthorize("@authorizationService.hasPermissionByLeaseId(#leaseId, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<List<InventoryDTOs.VerificationItemResponse>>> generateMoveOutChecklist(
            @PathVariable UUID leaseId,
            @RequestBody(required = false) InventoryDTOs.MoveOutChecklistRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        List<InventoryDTOs.VerificationItemResponse> response = assignmentService.generateMoveOutChecklist(
                leaseId, 
                request != null ? request : new InventoryDTOs.MoveOutChecklistRequest(null), 
                userId
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/assignments/{assignmentId}/return-verification")
    @PreAuthorize("@authorizationService.hasPermissionByAssignmentId(#assignmentId, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<InventoryDTOs.VerificationItemResponse>> verifyReturn(
            @PathVariable UUID assignmentId,
            @Valid @RequestBody InventoryDTOs.ReturnVerificationRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        InventoryDTOs.VerificationItemResponse response = assignmentService.verifyReturn(assignmentId, request, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PostMapping("/leases/{leaseId}/deductions/approve")
    @PreAuthorize("@authorizationService.hasPermissionByLeaseId(#leaseId, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<List<InventoryDTOs.VerificationItemResponse>>> approveDeductions(
            @PathVariable UUID leaseId,
            @RequestBody InventoryDTOs.ApproveDeductionsRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID userId = UUID.fromString(currentUser.getId());
        List<InventoryDTOs.VerificationItemResponse> response = assignmentService.approveDeductions(leaseId, request, userId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/leases/{leaseId}/verification-checklist")
    @PreAuthorize("@authorizationService.hasPermissionByLeaseId(#leaseId, 'LEASE_VIEW') or @authorizationService.hasPermissionByLeaseId(#leaseId, 'LEASE_VIEW_OWN')")
    public ResponseEntity<ApiResponse<List<InventoryDTOs.VerificationItemResponse>>> getVerificationChecklist(
            @PathVariable UUID leaseId) {
        List<InventoryDTOs.VerificationItemResponse> response = assignmentService.getVerificationChecklistForLease(leaseId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
