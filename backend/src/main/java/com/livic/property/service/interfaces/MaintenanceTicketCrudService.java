package com.livic.property.service.interfaces;

import com.livic.common.service.interfaces.CrudService;
import com.livic.property.domain.MaintenanceTicketTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface MaintenanceTicketCrudService extends CrudService<MaintenanceTicketTbl, UUID> {
    Page<MaintenanceTicketTbl> findByTenantId(UUID tenantId, Pageable pageable);
    long countByTenantId(UUID tenantId);
    long countByTenantIdAndStatus(UUID tenantId, String status);
}
