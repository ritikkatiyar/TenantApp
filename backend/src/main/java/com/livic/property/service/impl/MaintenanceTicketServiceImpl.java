package com.livic.property.service.impl;

import com.livic.property.domain.MaintenanceTicketTbl;
import com.livic.property.dto.MaintenanceTicketDTOs;
import com.livic.property.service.interfaces.MaintenanceTicketCrudService;
import com.livic.property.service.interfaces.MaintenanceTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class MaintenanceTicketServiceImpl implements MaintenanceTicketService {

    private final MaintenanceTicketCrudService maintenanceTicketCrudService;

    @Override
    public MaintenanceTicketDTOs.MaintenanceTicketResponse createTicket(UUID tenantId, MaintenanceTicketDTOs.CreateTicketRequest request) {
        String ticketNumber = "TKT-" + (System.currentTimeMillis() % 1000000);

        MaintenanceTicketTbl ticket = MaintenanceTicketTbl.builder()
                .ticketNumber(ticketNumber)
                .tenantId(tenantId)
                .leaseId(request.leaseId())
                .propertyId(request.propertyId())
                .unitId(request.unitId())
                .title(request.title())
                .description(request.description())
                .category(request.category())
                .priority(request.priority() != null ? request.priority() : "STANDARD")
                .status("PENDING")
                .build();

        MaintenanceTicketTbl saved = maintenanceTicketCrudService.save(ticket);
        return MaintenanceTicketDTOs.MaintenanceTicketResponse.from(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<MaintenanceTicketDTOs.MaintenanceTicketResponse> listTenantTickets(UUID tenantId, Pageable pageable) {
        return maintenanceTicketCrudService.findByTenantId(tenantId, pageable)
                .map(MaintenanceTicketDTOs.MaintenanceTicketResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public MaintenanceTicketDTOs.TicketHealthStatsResponse getHealthStats(UUID tenantId) {
        long total = maintenanceTicketCrudService.countByTenantId(tenantId);
        long pending = maintenanceTicketCrudService.countByTenantIdAndStatus(tenantId, "PENDING");
        long resolved = maintenanceTicketCrudService.countByTenantIdAndStatus(tenantId, "RESOLVED");

        return new MaintenanceTicketDTOs.TicketHealthStatsResponse(total, pending, resolved);
    }
}
