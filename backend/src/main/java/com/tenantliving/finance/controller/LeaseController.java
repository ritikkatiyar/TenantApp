package com.tenantliving.finance.controller;

import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.finance.dto.LeaseDTOs;
import com.tenantliving.finance.mapper.LeaseMapper;
import com.tenantliving.finance.service.interfaces.LeaseService;
import com.tenantliving.finance.service.interfaces.LeaseQueryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.tenantliving.common.domain.LeaseStatus;
import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.user.service.interfaces.UserQueryService;
import com.tenantliving.user.domain.UserTbl;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/leases")
@RequiredArgsConstructor
public class LeaseController {

    private final LeaseService leaseService;
    private final LeaseQueryService leaseQueryService;
    private final UserQueryService userQueryService;

    @GetMapping
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'LEASE_VIEW')")
    public ResponseEntity<ApiResponse<List<LeaseDTOs.LeaseResponse>>> getActiveLeasesByProperty(
            @RequestParam UUID propertyId
    ) {
        List<LeaseTbl> leases = leaseQueryService.findActiveLeasesByProperty(propertyId);
        List<UUID> userIds = leases.stream().map(LeaseTbl::getUserId).toList();
        Map<UUID, UserTbl> usersMap = userQueryService.getUsersByIds(userIds);

        List<LeaseDTOs.LeaseResponse> responseList = leases.stream()
                .map(lease -> LeaseMapper.toResponse(lease, usersMap.get(lease.getUserId())))
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responseList));
    }

    @GetMapping("/tenant/active")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<LeaseDTOs.LeaseResponse>> getActiveTenantLease(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UUID userId = UUID.fromString(currentUser.getId());
        return leaseQueryService.findByUserIdAndStatus(userId, LeaseStatus.ACTIVE)
                .map(lease -> {
                    UserTbl user = userQueryService.getUserById(lease.getUserId());
                    return ResponseEntity.ok(ApiResponse.success(LeaseMapper.toResponse(lease, user)));
                })
                .orElseGet(() -> ResponseEntity.ok(ApiResponse.success(null)));
    }

    @PostMapping
    @PreAuthorize("@authorizationService.hasPermissionByUnitId(#request.unitId, 'LEASE_CREATE')")
    public ResponseEntity<ApiResponse<LeaseDTOs.LeaseResponse>> create(
            @Valid @RequestBody LeaseDTOs.CreateLeaseRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        UUID assignedByUserId = currentUser != null ? UUID.fromString(currentUser.getId()) : null;
        LeaseTbl lease = leaseService.createLease(request, assignedByUserId);
        UserTbl user = userQueryService.getUserById(lease.getUserId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(LeaseMapper.toResponse(lease, user)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@authorizationService.hasPermissionByLeaseId(#id, 'LEASE_VIEW') or @authorizationService.hasPermissionByLeaseId(#id, 'LEASE_VIEW_OWN')")
    public ResponseEntity<ApiResponse<LeaseDTOs.LeaseResponse>> get(
            @PathVariable UUID id
    ) {
        LeaseTbl lease = leaseQueryService.getLeaseById(id);
        UserTbl user = userQueryService.getUserById(lease.getUserId());
        return ResponseEntity.ok(ApiResponse.success(LeaseMapper.toResponse(lease, user)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@authorizationService.hasPermissionByLeaseId(#id, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<Void>> deleteLease(
            @PathVariable UUID id
    ) {
        leaseService.deleteLease(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/{id}/notice")
    @PreAuthorize("@authorizationService.hasPermissionByLeaseId(#id, 'LEASE_UPDATE')")
    public ResponseEntity<ApiResponse<LeaseDTOs.LeaseResponse>> serveNotice(
            @PathVariable UUID id,
            @RequestBody Map<String, String> request
    ) {
        String moveOutDateStr = request.get("moveOutDate");
        LocalDate moveOutDate = moveOutDateStr != null ? LocalDate.parse(moveOutDateStr) : null;
        LeaseTbl lease = leaseService.updateNoticePeriod(id, moveOutDate);
        UserTbl user = userQueryService.getUserById(lease.getUserId());
        return ResponseEntity.ok(ApiResponse.success(LeaseMapper.toResponse(lease, user)));
    }
}
