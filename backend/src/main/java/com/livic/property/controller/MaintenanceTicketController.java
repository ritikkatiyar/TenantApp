package com.livic.property.controller;

import com.livic.auth.principal.UserDetailsImpl;
import com.livic.common.response.ApiResponse;
import com.livic.property.domain.MaintenanceTicketTbl;
import com.livic.property.dto.MaintenanceTicketDTOs;
import com.livic.property.repository.MaintenanceTicketRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/property/tenant/maintenance-tickets")
@RequiredArgsConstructor
public class MaintenanceTicketController {

    private final MaintenanceTicketRepository maintenanceTicketRepository;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MaintenanceTicketDTOs.MaintenanceTicketResponse>> createTicket(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody MaintenanceTicketDTOs.CreateTicketRequest request
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UUID tenantId = UUID.fromString(currentUser.getId());
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

        MaintenanceTicketTbl saved = maintenanceTicketRepository.save(ticket);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(MaintenanceTicketDTOs.MaintenanceTicketResponse.from(saved)));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Page<MaintenanceTicketDTOs.MaintenanceTicketResponse>>> listTenantTickets(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC, size = 15) Pageable pageable
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UUID tenantId = UUID.fromString(currentUser.getId());
        Page<MaintenanceTicketDTOs.MaintenanceTicketResponse> page = maintenanceTicketRepository
                .findByTenantId(tenantId, pageable)
                .map(MaintenanceTicketDTOs.MaintenanceTicketResponse::from);
        return ResponseEntity.ok(ApiResponse.success(page));
    }

    @GetMapping("/health-stats")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<MaintenanceTicketDTOs.TicketHealthStatsResponse>> getHealthStats(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UUID tenantId = UUID.fromString(currentUser.getId());
        long total = maintenanceTicketRepository.countByTenantId(tenantId);
        long pending = maintenanceTicketRepository.countByTenantIdAndStatus(tenantId, "PENDING");
        long resolved = maintenanceTicketRepository.countByTenantIdAndStatus(tenantId, "RESOLVED");

        return ResponseEntity.ok(ApiResponse.success(new MaintenanceTicketDTOs.TicketHealthStatsResponse(total, pending, resolved)));
    }
}
