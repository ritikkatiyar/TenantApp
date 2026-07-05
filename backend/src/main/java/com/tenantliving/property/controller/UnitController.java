package com.tenantliving.property.controller;

import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.property.dto.PropertyDTOs;
import com.tenantliving.property.dto.UnitDTOs;
import com.tenantliving.property.domain.UnitTbl;
import com.tenantliving.property.service.interfaces.UnitService;
import com.tenantliving.property.service.interfaces.UnitQueryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/property/properties/{propertyId}")
@RequiredArgsConstructor
public class UnitController {

    private final UnitService unitService;
    private final UnitQueryService unitQueryService;
    private final com.tenantliving.property.facade.UnitLayoutFacade unitLayoutFacade;

    @GetMapping("/floors")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<List<UnitDTOs.FloorSummaryResponse>>> listFloorsForConfiguration(
            @PathVariable UUID propertyId,
            @RequestParam(required = false) Integer throughFloor) {
        List<UnitDTOs.FloorSummaryResponse> rows = unitQueryService.getFloorSummaries(propertyId, throughFloor);
        return ResponseEntity.ok(ApiResponse.success(rows));
    }

    @GetMapping("/floors/{floorNumber}/layout")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<List<UnitDTOs.UnitResponse>>> getFloorLayout(
            @PathVariable UUID propertyId,
            @PathVariable int floorNumber) {
        List<UnitDTOs.UnitResponse> layout = unitLayoutFacade.getFloorLayout(propertyId, floorNumber);
        return ResponseEntity.ok(ApiResponse.success(layout));
    }

    @GetMapping("/floors/layouts")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<List<UnitDTOs.UnitResponse>>> getAllFloorsLayout(
            @PathVariable UUID propertyId) {
        List<UnitDTOs.UnitResponse> layout = unitLayoutFacade.getAllFloorsLayout(propertyId);
        return ResponseEntity.ok(ApiResponse.success(layout));
    }

    @PutMapping("/floors/{floorNumber}/layout")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<List<UnitDTOs.UnitResponse>>> saveFloorLayout(
            @PathVariable UUID propertyId,
            @PathVariable int floorNumber,
            @Valid @RequestBody List<UnitDTOs.FloorLayoutUnitRequest> items) {
        List<UnitDTOs.UnitResponse> saved = unitLayoutFacade.saveFloorLayout(propertyId, floorNumber, items);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    @PostMapping("/units/batch")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<List<UnitDTOs.UnitResponse>>> generateBatchUnits(
            @PathVariable UUID propertyId,
            @Valid @RequestBody PropertyDTOs.BatchUnitRequest request) {
        List<UnitTbl> units = unitService.generateBatchUnits(propertyId, request);
        return ResponseEntity.ok(ApiResponse.success(unitLayoutFacade.getFloorLayout(propertyId, request.startingFloorNumber())));
    }
}
