package com.tenantliving.property.domain;

import com.tenantliving.common.domain.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "maintenance_ticket_tbl")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MaintenanceTicketTbl extends BaseEntity {

    @Column(name = "ticket_number", nullable = false, unique = true, length = 32)
    private String ticketNumber;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "lease_id", nullable = false)
    private UUID leaseId;

    @Column(name = "property_id", nullable = false)
    private UUID propertyId;

    @Column(name = "unit_id", nullable = false)
    private UUID unitId;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "category", nullable = false, length = 64)
    private String category;

    @Column(name = "priority", nullable = false, length = 32)
    @Builder.Default
    private String priority = "STANDARD";

    @Column(name = "status", nullable = false, length = 64)
    @Builder.Default
    private String status = "PENDING";

    @Column(name = "assigned_technician_name", length = 128)
    private String assignedTechnicianName;
}
