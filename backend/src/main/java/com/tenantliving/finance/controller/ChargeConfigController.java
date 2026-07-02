package com.tenantliving.finance.controller;

import com.tenantliving.finance.dto.ChargeConfigDTOs.ChargeConfigRequest;
import com.tenantliving.finance.dto.ChargeConfigDTOs.ChargeConfigResponse;
import com.tenantliving.finance.service.ChargeConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.tenantliving.common.response.ApiResponse;

import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/charge-configs")

public class ChargeConfigController {

    private final ChargeConfigService chargeConfigService;

    @Autowired
    public ChargeConfigController(ChargeConfigService chargeConfigService) {
        this.chargeConfigService = chargeConfigService;
    }

    @PostMapping
    @PreAuthorize("@authorizationService.hasPermission(#request.propertyId, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<ChargeConfigResponse>> createChargeConfig(@RequestBody ChargeConfigRequest request) {
        ChargeConfigResponse response = chargeConfigService.createChargeConfig(request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@authorizationService.hasPermissionByChargeConfigId(#id, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<ChargeConfigResponse>> updateChargeConfig(@PathVariable UUID id, @RequestBody ChargeConfigRequest request) {
        ChargeConfigResponse response = chargeConfigService.updateChargeConfig(id, request);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@authorizationService.hasPermissionByChargeConfigId(#id, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deactivateChargeConfig(@PathVariable UUID id) {
        chargeConfigService.deactivateChargeConfig(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/property/{propertyId}")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<List<ChargeConfigResponse>>> getActiveChargesForProperty(@PathVariable UUID propertyId) {
        List<ChargeConfigResponse> responses = chargeConfigService.getActiveChargesForProperty(propertyId);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@authorizationService.hasPermissionByChargeConfigId(#id, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<ChargeConfigResponse>> getChargeConfigById(@PathVariable UUID id) {
        ChargeConfigResponse response = chargeConfigService.getChargeConfigById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
