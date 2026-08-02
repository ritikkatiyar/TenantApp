package com.livic.property.service.interfaces;

import com.livic.property.dto.MaintenanceTicketDTOs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface MaintenanceTicketService {

    MaintenanceTicketDTOs.MaintenanceTicketResponse createTicket(UUID tenantId, MaintenanceTicketDTOs.CreateTicketRequest request);

    Page<MaintenanceTicketDTOs.MaintenanceTicketResponse> listTenantTickets(UUID tenantId, Pageable pageable);

    MaintenanceTicketDTOs.TicketHealthStatsResponse getHealthStats(UUID tenantId);
}
