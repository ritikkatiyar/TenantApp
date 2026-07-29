package com.livic.property.dto;

import com.livic.property.domain.MaintenanceTicketTbl;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDateTime;
import java.util.UUID;

public class MaintenanceTicketDTOs {

    public record CreateTicketRequest(
            @NotBlank String title,
            @NotBlank String description,
            @NotBlank String category,
            String priority,
            @NotNull UUID propertyId,
            @NotNull UUID unitId,
            @NotNull UUID leaseId
    ) {}

    public record MaintenanceTicketResponse(
            UUID id,
            String ticketNumber,
            UUID tenantId,
            UUID leaseId,
            UUID propertyId,
            UUID unitId,
            String title,
            String description,
            String category,
            String priority,
            String status,
            String assignedTechnicianName,
            LocalDateTime createdAt,
            LocalDateTime updatedAt
    ) {
        public static MaintenanceTicketResponse from(MaintenanceTicketTbl entity) {
            return new MaintenanceTicketResponse(
                    entity.getId(),
                    entity.getTicketNumber(),
                    entity.getTenantId(),
                    entity.getLeaseId(),
                    entity.getPropertyId(),
                    entity.getUnitId(),
                    entity.getTitle(),
                    entity.getDescription(),
                    entity.getCategory(),
                    entity.getPriority(),
                    entity.getStatus(),
                    entity.getAssignedTechnicianName(),
                    entity.getCreatedAt(),
                    entity.getUpdatedAt()
            );
        }
    }

    public record TicketHealthStatsResponse(
            long totalTickets,
            long pendingCount,
            long resolvedCount
    ) {}
}
