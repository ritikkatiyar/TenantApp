package com.livic.property.controller;

import com.livic.auth.principal.UserDetailsImpl;
import com.livic.common.response.ApiResponse;
import com.livic.property.dto.MaintenanceTicketDTOs;
import com.livic.property.service.interfaces.MaintenanceTicketService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/properties/maintenance-tickets")
@RequiredArgsConstructor
public class MaintenanceTicketController {

    private final MaintenanceTicketService maintenanceTicketService;

    @PostMapping
    public ResponseEntity<ApiResponse<MaintenanceTicketDTOs.MaintenanceTicketResponse>> createTicket(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody MaintenanceTicketDTOs.CreateTicketRequest request
    ) {
        UUID tenantId = UUID.fromString(currentUser.getId());
        MaintenanceTicketDTOs.MaintenanceTicketResponse response = maintenanceTicketService.createTicket(tenantId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<MaintenanceTicketDTOs.MaintenanceTicketResponse>>> listTenantTickets(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC, size = 15) Pageable pageable
    ) {
        UUID tenantId = UUID.fromString(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(maintenanceTicketService.listTenantTickets(tenantId, pageable)));
    }

    @GetMapping("/health-stats")
    public ResponseEntity<ApiResponse<MaintenanceTicketDTOs.TicketHealthStatsResponse>> getHealthStats(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        UUID tenantId = UUID.fromString(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(maintenanceTicketService.getHealthStats(tenantId)));
    }
}
