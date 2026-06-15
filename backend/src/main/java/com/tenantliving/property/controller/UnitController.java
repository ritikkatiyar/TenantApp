package com.tenantliving.property.controller;

import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.property.dto.PropertyDTOs;
import com.tenantliving.property.dto.UnitDTOs;
import com.tenantliving.property.service.interfaces.UnitService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/property/properties/{propertyId}")
@RequiredArgsConstructor
    /**
     * Units
     * Floor summaries and unit layout
     */

public class UnitController {

    private final UnitService unitService;
    private final com.tenantliving.property.facade.UnitLayoutFacade unitLayoutFacade;

    @GetMapping("/floors")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
        /**
     * List floors for configuration
     * Returns each floor from the top down with unit counts and configured flag. 
     */

    
    public ResponseEntity<ApiResponse<List<UnitDTOs.FloorSummaryResponse>>> listFloorsForConfiguration(
            
            @PathVariable UUID propertyId,

            @RequestParam(required = false) Integer throughFloor) {
        List<UnitDTOs.FloorSummaryResponse> rows = unitService.getFloorSummaries(propertyId, throughFloor);
        return ResponseEntity.ok(ApiResponse.success(rows));
    }

    @GetMapping("/floors/{floorNumber}/layout")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
        /**
     * Get floor layout
     * Retrieves the saved layout of units for a specific floor.
     */

    
    public ResponseEntity<ApiResponse<List<UnitDTOs.UnitResponse>>> getFloorLayout(
            @PathVariable UUID propertyId,
            @PathVariable int floorNumber) {
        List<UnitDTOs.UnitResponse> layout = unitLayoutFacade.getFloorLayout(propertyId, floorNumber);
        return ResponseEntity.ok(ApiResponse.success(layout));
    }

    @GetMapping("/floors/layouts")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
        /**
     * Get all floors layout
     * Retrieves the saved layout of units for all floors of a property.
     */

    
    public ResponseEntity<ApiResponse<List<UnitDTOs.UnitResponse>>> getAllFloorsLayout(
            @PathVariable UUID propertyId) {
        List<UnitDTOs.UnitResponse> layout = unitLayoutFacade.getAllFloorsLayout(propertyId);
        return ResponseEntity.ok(ApiResponse.success(layout));
    }

    @PutMapping("/floors/{floorNumber}/layout")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_EDIT')")
        /**
     * Save floor layout
     * Creates or updates units on one floor from the layout editor payload. 
     */

    
    public ResponseEntity<ApiResponse<List<UnitDTOs.UnitResponse>>> saveFloorLayout(
            @PathVariable UUID propertyId,
            @PathVariable int floorNumber,
            @Valid @RequestBody List<UnitDTOs.FloorLayoutUnitRequest> items) {
        List<UnitDTOs.UnitResponse> saved = unitLayoutFacade.saveFloorLayout(propertyId, floorNumber, items);
        return ResponseEntity.ok(ApiResponse.success(saved));
    }

    @PostMapping("/units/batch")
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_EDIT')")
        /**
     * Generate units in a grid
     * Creates units per floor/grid for the property. Unit numbers combine optional prefix, floor, and index.
     */

    
    public ResponseEntity<Void> batchCreateUnits(
            
            @PathVariable UUID propertyId,
            @Valid @RequestBody PropertyDTOs.BatchUnitRequest request) {
        unitService.generateBatchUnits(propertyId, request);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
