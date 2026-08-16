package com.livic.inventory.mapper;

import com.livic.inventory.domain.InventoryItemTbl;
import com.livic.inventory.domain.InventoryServiceExpenseTbl;
import com.livic.inventory.domain.LeaseInventoryAssignmentTbl;
import com.livic.inventory.domain.enums.InventoryCategory;
import com.livic.inventory.domain.enums.InventoryCondition;
import com.livic.inventory.domain.enums.InventoryScope;
import com.livic.inventory.dto.InventoryDTOs;
import com.livic.inventory.facade.InventoryFacade.InventoryPropertyMetricsDTO;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.UUID;

public final class InventoryMapper {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE;

    private InventoryMapper() {}

    public static String getIconForCategory(InventoryCategory category) {
        if (category == null) return "inventory-2";
        return switch (category) {
            case APPLIANCES -> "kitchen";
            case FURNITURE -> "chair";
            case HVAC -> "ac-unit";
            case LAUNDRY -> "local-laundry-service";
            case ELECTRONICS -> "tv";
            case FIXTURES -> "layers";
            case SAFETY -> "security";
            case OTHER -> "inventory-2";
        };
    }

    public static InventoryPropertyMetricsDTO toPropertyMetricsDTO(
            long totalAssets,
            long maintenanceDue,
            long unassigned,
            BigDecimal totalValuation) {
        return new InventoryPropertyMetricsDTO(
                totalAssets,
                maintenanceDue,
                unassigned,
                totalValuation != null ? totalValuation : BigDecimal.ZERO
        );
    }

    public static InventoryDTOs.InventoryItemResponse toResponse(
            InventoryItemTbl entity, 
            String unitNumber, 
            String primaryImageUrl) {
        
        String location = entity.getScope() == InventoryScope.PROPERTY_SHARED 
                ? "Shared Property" 
                : (unitNumber != null ? "Unit " + unitNumber : "Private Unit");

        String nextServiceStr = entity.getNextServiceDate() != null 
                ? entity.getNextServiceDate().format(DATE_FORMATTER) 
                : null;

        return new InventoryDTOs.InventoryItemResponse(
                entity.getId(),
                entity.getPropertyId(),
                entity.getUnitId(),
                entity.getName(),
                capitalize(entity.getCategory().name()),
                location,
                entity.getSerialNumber() != null ? entity.getSerialNumber() : "",
                entity.getModelNumber() != null ? entity.getModelNumber() : "",
                entity.getCurrentCondition() != null ? entity.getCurrentCondition().getLabel() : "Good",
                entity.getStatus() != null ? entity.getStatus().getLabel() : "Available",
                nextServiceStr,
                entity.getReplacementValue(),
                entity.getScope() == InventoryScope.PROPERTY_SHARED,
                getIconForCategory(entity.getCategory()),
                primaryImageUrl != null ? primaryImageUrl : "",
                entity.getNotes() != null ? entity.getNotes() : "",
                entity.getCreatedAt()
        );
    }

    public static InventoryDTOs.AssignmentItemResponse toAssignmentResponse(
            InventoryItemTbl item,
            LeaseInventoryAssignmentTbl assignment,
            String unitNumber,
            String primaryImageUrl,
            int photoCount) {

        String location = item.getScope() == InventoryScope.PROPERTY_SHARED
                ? "Shared Property"
                : (unitNumber != null ? "Unit " + unitNumber : "Private Unit");

        String nextServiceStr = item.getNextServiceDate() != null
                ? item.getNextServiceDate().format(DATE_FORMATTER)
                : null;

        String assignmentStatus = assignment != null ? (assignment.getReturnedAt() == null ? "Selected" : "Unselected") : "Draft";
        String assignmentCondition = assignment != null && assignment.getConditionAtAssignment() != null 
                ? assignment.getConditionAtAssignment().getLabel() 
                : (item.getCurrentCondition() != null ? item.getCurrentCondition().getLabel() : "Good");

        return new InventoryDTOs.AssignmentItemResponse(
                item.getId(),
                assignment != null ? assignment.getId() : null,
                assignment != null ? assignment.getLeaseId() : null,
                item.getPropertyId(),
                item.getUnitId(),
                item.getName(),
                capitalize(item.getCategory().name()),
                location,
                item.getSerialNumber() != null ? item.getSerialNumber() : "",
                item.getCurrentCondition() != null ? item.getCurrentCondition().getLabel() : "Good",
                item.getStatus() != null ? item.getStatus().getLabel() : "Assigned",
                nextServiceStr,
                item.getReplacementValue(),
                item.getScope() == InventoryScope.PROPERTY_SHARED,
                getIconForCategory(item.getCategory()),
                primaryImageUrl != null ? primaryImageUrl : "",
                item.getNotes() != null ? item.getNotes() : "",
                assignmentStatus,
                assignmentCondition,
                photoCount,
                assignment != null ? assignment.getAssignedAt() : null
        );
    }

    public static InventoryDTOs.VerificationItemResponse toVerificationResponse(
            LeaseInventoryAssignmentTbl assignment,
            InventoryItemTbl item,
            String unitNumber,
            String moveInPhotoUrl,
            String returnPhotoUrl) {

        String area = item.getScope() == InventoryScope.PROPERTY_SHARED
                ? "Shared Area"
                : (unitNumber != null ? "Unit " + unitNumber : "Private Area");

        String moveInCond = assignment.getConditionAtAssignment() != null 
                ? assignment.getConditionAtAssignment().getLabel() 
                : "Good";
        String returnCond = assignment.getConditionAtReturn() != null 
                ? assignment.getConditionAtReturn().getLabel() 
                : moveInCond;

        String status = "Good";
        if (assignment.getConditionAtReturn() == InventoryCondition.DAMAGED) {
            status = "Damaged";
        } else if (assignment.getReturnedAt() == null) {
            status = "Review";
        }

        return new InventoryDTOs.VerificationItemResponse(
                assignment.getId(),
                item.getId(),
                assignment.getLeaseId(),
                item.getName(),
                area,
                getIconForCategory(item.getCategory()),
                moveInCond,
                returnCond,
                assignment.getReturnNotes() != null ? assignment.getReturnNotes() : "",
                assignment.getDamageDeductionAmount() != null ? assignment.getDamageDeductionAmount() : java.math.BigDecimal.ZERO,
                status,
                moveInPhotoUrl != null ? moveInPhotoUrl : "",
                returnPhotoUrl != null ? returnPhotoUrl : "",
                assignment.getReturnedAt(),
                assignment.getSettledAt()
        );
    }

    public static InventoryDTOs.ServiceExpenseResponse toServiceExpenseResponse(InventoryServiceExpenseTbl entity) {
        return new InventoryDTOs.ServiceExpenseResponse(
                entity.getId(),
                entity.getItemId(),
                entity.getPropertyId(),
                entity.getVendorName(),
                entity.getServiceDate(),
                entity.getAmount(),
                entity.getDescription(),
                entity.getNextServiceDate(),
                entity.getRecordedBy(),
                entity.getCreatedAt()
        );
    }

    private static String capitalize(String str) {
        if (str == null || str.isEmpty()) return "";
        return str.substring(0, 1).toUpperCase() + str.substring(1).toLowerCase();
    }
}
