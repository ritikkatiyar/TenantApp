package com.livic.property.repository;

import com.livic.property.domain.MaintenanceTicketTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MaintenanceTicketRepository extends JpaRepository<MaintenanceTicketTbl, UUID> {
    Page<MaintenanceTicketTbl> findByTenantId(UUID tenantId, Pageable pageable);
    long countByTenantIdAndStatus(UUID tenantId, String status);
    long countByTenantId(UUID tenantId);
}
