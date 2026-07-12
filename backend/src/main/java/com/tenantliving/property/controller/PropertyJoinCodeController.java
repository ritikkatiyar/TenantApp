package com.tenantliving.property.controller;

import com.tenantliving.property.domain.PropertyJoinCodeTbl;
import com.tenantliving.property.dto.PropertyJoinCodeDTOs;
import com.tenantliving.property.service.interfaces.PropertyJoinCodeService;
import com.tenantliving.auth.domain.MembershipTbl;
import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.common.response.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/property")
@RequiredArgsConstructor
public class PropertyJoinCodeController {

    private final PropertyJoinCodeService propertyJoinCodeService;

    @PostMapping("/properties/{propertyId}/join-codes")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MANAGE_STAFF')")
    public ResponseEntity<ApiResponse<PropertyJoinCodeDTOs.JoinCodeResponse>> generateJoinCode(
            @PathVariable UUID propertyId,
            @Valid @RequestBody PropertyJoinCodeDTOs.GenerateJoinCodeRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        UUID actorId = UUID.fromString(currentUser.getId());
        PropertyJoinCodeTbl created = propertyJoinCodeService.generateJoinCode(
                propertyId, 
                request.roleCode(), 
                request.maxUses(), 
                actorId
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(toResponse(created)));
    }

    @GetMapping("/properties/{propertyId}/join-codes")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'MANAGE_STAFF')")
    public ResponseEntity<ApiResponse<List<PropertyJoinCodeDTOs.JoinCodeResponse>>> getPropertyJoinCodes(
            @PathVariable UUID propertyId) {
        List<PropertyJoinCodeDTOs.JoinCodeResponse> responses = propertyJoinCodeService.getPropertyJoinCodes(propertyId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping("/join-codes/validate")
    public ResponseEntity<ApiResponse<PropertyJoinCodeDTOs.JoinCodeResultResponse>> validateAndApplyJoinCode(
            @Valid @RequestBody PropertyJoinCodeDTOs.ValidateJoinCodeRequest request,
            @AuthenticationPrincipal UserDetailsImpl currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        UUID userId = UUID.fromString(currentUser.getId());
        MembershipTbl membership = propertyJoinCodeService.validateAndApplyJoinCode(request.code(), userId);
        
        PropertyJoinCodeDTOs.JoinCodeResultResponse response = new PropertyJoinCodeDTOs.JoinCodeResultResponse(
                membership.getProperty().getId(),
                membership.getProperty().getName(),
                membership.getRole().getCode(),
                membership.getId()
        );
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    private PropertyJoinCodeDTOs.JoinCodeResponse toResponse(PropertyJoinCodeTbl jc) {
        return new PropertyJoinCodeDTOs.JoinCodeResponse(
                jc.getId(),
                jc.getCode(),
                jc.getRole().getCode(),
                jc.getRole().getName(),
                jc.getMaxUses(),
                jc.getUsesCount(),
                jc.isActive(),
                jc.getExpiresAt()
        );
    }
}
