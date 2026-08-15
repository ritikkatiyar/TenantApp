package com.livic.inventory.service.interfaces;

import com.livic.inventory.dto.InventoryDTOs;

import java.util.List;
import java.util.UUID;

public interface LeaseInventoryAssignmentService {

    List<InventoryDTOs.AssignmentItemResponse> createAssignments(UUID leaseId, InventoryDTOs.CreateAssignmentRequest request, UUID userId);

    List<InventoryDTOs.AssignmentItemResponse> getAssignmentsForLease(UUID leaseId);

    List<InventoryDTOs.VerificationItemResponse> generateMoveOutChecklist(UUID leaseId, InventoryDTOs.MoveOutChecklistRequest request, UUID userId);

    InventoryDTOs.VerificationItemResponse verifyReturn(UUID assignmentId, InventoryDTOs.ReturnVerificationRequest request, UUID userId);

    List<InventoryDTOs.VerificationItemResponse> approveDeductions(UUID leaseId, InventoryDTOs.ApproveDeductionsRequest request, UUID userId);

    List<InventoryDTOs.VerificationItemResponse> getVerificationChecklistForLease(UUID leaseId);
}
