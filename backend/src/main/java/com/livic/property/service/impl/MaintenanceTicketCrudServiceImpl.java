package com.livic.property.service.impl;

import com.livic.common.service.impl.AbstractCrudService;
import com.livic.property.domain.MaintenanceTicketTbl;
import com.livic.property.repository.MaintenanceTicketRepository;
import com.livic.property.service.interfaces.MaintenanceTicketCrudService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class MaintenanceTicketCrudServiceImpl
        extends AbstractCrudService<MaintenanceTicketTbl, UUID, MaintenanceTicketRepository>
        implements MaintenanceTicketCrudService {

    public MaintenanceTicketCrudServiceImpl(MaintenanceTicketRepository repository) {
        super(repository);
    }

    @Override
    public Page<MaintenanceTicketTbl> findByTenantId(UUID tenantId, Pageable pageable) {
        return repository.findByTenantId(tenantId, pageable);
    }

    @Override
    public long countByTenantId(UUID tenantId) {
        return repository.countByTenantId(tenantId);
    }

    @Override
    public long countByTenantIdAndStatus(UUID tenantId, String status) {
        return repository.countByTenantIdAndStatus(tenantId, status);
    }
}
