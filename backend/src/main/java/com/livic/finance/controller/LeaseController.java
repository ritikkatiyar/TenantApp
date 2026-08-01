package com.livic.finance.controller;

import com.livic.common.response.ApiResponse;
import com.livic.auth.principal.UserDetailsImpl;
import com.livic.finance.dto.LeaseDTOs;
import com.livic.finance.mapper.LeaseMapper;
import com.livic.finance.service.interfaces.LeaseService;
import com.livic.finance.service.interfaces.LeaseQueryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import com.livic.common.domain.LeaseStatus;
import com.livic.finance.domain.LeaseTbl;
import com.livic.user.service.interfaces.UserQueryService;
import com.livic.user.domain.UserTbl;

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
