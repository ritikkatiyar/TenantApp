package com.livic.finance.controller;

import com.livic.finance.dto.ChargeConfigDTOs.ChargeConfigRequest;
import com.livic.finance.dto.ChargeConfigDTOs.ChargeConfigResponse;
import com.livic.finance.service.ChargeConfigService;
import com.livic.finance.service.ChargeConfigQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.livic.common.response.ApiResponse;

import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/charge-configs")
@RequiredArgsConstructor
public class ChargeConfigController {

    private final ChargeConfigService chargeConfigService;
    private final ChargeConfigQueryService chargeConfigQueryService;

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

    @PostMapping("/{id}/reactivate")
    @PreAuthorize("@authorizationService.hasPermissionByChargeConfigId(#id, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<Void>> reactivateChargeConfig(@PathVariable UUID id) {
        chargeConfigService.reactivateChargeConfig(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/{id}/permanent")
    @PreAuthorize("@authorizationService.hasPermissionByChargeConfigId(#id, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<Void>> deleteChargeConfigPermanently(@PathVariable UUID id) {
        chargeConfigService.deleteChargeConfigPermanently(id);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @GetMapping("/property/{propertyId}")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<List<ChargeConfigResponse>>> getChargesForProperty(
            @PathVariable UUID propertyId,
            @RequestParam(required = false, defaultValue = "false") boolean includeInactive
    ) {
        List<ChargeConfigResponse> responses = chargeConfigQueryService.getChargesForProperty(propertyId, includeInactive);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @GetMapping("/{id}")
    @PreAuthorize("@authorizationService.hasPermissionByChargeConfigId(#id, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<ChargeConfigResponse>> getChargeConfigById(@PathVariable UUID id) {
        ChargeConfigResponse response = chargeConfigQueryService.getChargeConfigById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
