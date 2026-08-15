package com.livic.inventory.dto;

import com.livic.inventory.domain.enums.DeductionApprovalStatus;
import com.livic.inventory.domain.enums.InventoryCategory;
import com.livic.inventory.domain.enums.InventoryCondition;
import com.livic.inventory.domain.enums.InventoryScope;
import com.livic.inventory.domain.enums.InventoryStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public final class InventoryDTOs {

    private InventoryDTOs() {}

    public record CreateInventoryItemRequest(
            @NotNull(message = "Property ID is required")
            UUID propertyId,

            UUID unitId,

            @NotBlank(message = "Item name is required")
            String name,

            @NotNull(message = "Category is required")
            InventoryCategory category,

            String serialNumber,
            String modelNumber,

            @NotNull(message = "Scope is required")
            InventoryScope scope,

            @NotNull(message = "Condition is required")
            InventoryCondition currentCondition,

            @NotNull(message = "Status is required")
            InventoryStatus status,

            LocalDate purchaseDate,
            LocalDate warrantyExpiresAt,
            LocalDate nextServiceDate,

            @NotNull(message = "Replacement value is required")
            BigDecimal replacementValue,

            String notes
    ) {}

    public record UpdateInventoryItemRequest(
            UUID unitId,

            @NotBlank(message = "Item name is required")
            String name,

            @NotNull(message = "Category is required")
            InventoryCategory category,

            String serialNumber,
            String modelNumber,

            @NotNull(message = "Scope is required")
            InventoryScope scope,

            @NotNull(message = "Condition is required")
            InventoryCondition currentCondition,

            @NotNull(message = "Status is required")
            InventoryStatus status,

            LocalDate purchaseDate,
            LocalDate warrantyExpiresAt,
            LocalDate nextServiceDate,

            @NotNull(message = "Replacement value is required")
            BigDecimal replacementValue,

            String notes
    ) {}

    public record InventoryItemResponse(
            UUID id,
            UUID propertyId,
            UUID unitId,
            String name,
            String category,
            String location,
            String serial,
            String modelNumber,
            String condition,
            String status,
            String nextService,
            BigDecimal value,
            boolean shared,
            String icon,
            String image,
            String notes,
            Instant createdAt
    ) {}

    public record AssignmentItemResponse(
            UUID id,
            UUID assignmentId,
            UUID leaseId,
            UUID propertyId,
            UUID unitId,
            String name,
            String category,
            String location,
            String serial,
            String condition,
            String status,
            String nextService,
            BigDecimal value,
            boolean shared,
            String icon,
            String image,
            String notes,
            String assignmentStatus,
            String assignmentCondition,
            int photoCount,
            Instant assignedAt
    ) {}

    public record CreateAssignmentItemPayload(
            @NotNull(message = "Item ID is required")
            UUID itemId,

            @NotNull(message = "Condition at assignment is required")
            InventoryCondition conditionAtAssignment,

            String assignmentNotes,
            List<UUID> mediaAssetIds
    ) {}

    public record CreateAssignmentRequest(
            @NotNull(message = "Assignment items list is required")
            List<CreateAssignmentItemPayload> items
    ) {}

    public record ReturnVerificationRequest(
            @NotNull(message = "Condition at return is required")
            InventoryCondition conditionAtReturn,

            String returnNotes,
            BigDecimal damageDeductionAmount,
            DeductionApprovalStatus deductionApprovalStatus,
            List<UUID> mediaAssetIds
    ) {}

    public record VerificationItemResponse(
            UUID id,
            UUID itemId,
            UUID leaseId,
            String name,
            String area,
            String icon,
            String moveInCondition,
            String returnCondition,
            String damageDescription,
            BigDecimal deduction,
            String status,
            String moveInPhoto,
            String returnPhoto,
            Instant returnedAt,
            Instant settledAt
    ) {}

    public record MoveOutChecklistRequest(
            String defaultNotes
    ) {}

    public record ApproveDeductionsRequest(
            List<UUID> assignmentIds,
            boolean approveAll
    ) {}

    public record ServiceExpenseRequest(
            @NotBlank(message = "Vendor name is required")
            String vendorName,

            @NotNull(message = "Service date is required")
            LocalDate serviceDate,

            @NotNull(message = "Amount is required")
            BigDecimal amount,

            @NotBlank(message = "Description is required")
            String description,

            LocalDate nextServiceDate
    ) {}

    public record ServiceExpenseResponse(
            UUID id,
            UUID itemId,
            UUID propertyId,
            String vendorName,
            LocalDate serviceDate,
            BigDecimal amount,
            String description,
            LocalDate nextServiceDate,
            UUID recordedBy,
            Instant createdAt
    ) {}

    public record InventoryStatsResponse(
            long totalAssets,
            long maintenanceDue,
            long unassigned,
            BigDecimal totalValuation
    ) {}

    public record TenantVisibleInventoryResponse(
            List<InventoryItemResponse> unitItems,
            List<InventoryItemResponse> sharedItems
    ) {}
}
