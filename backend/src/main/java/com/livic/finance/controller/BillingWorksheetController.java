package com.livic.finance.controller;

import com.livic.common.response.ApiResponse;
import com.livic.finance.dto.BillingWorksheetDTOs.WorksheetEntryResponse;
import com.livic.finance.dto.BillingWorksheetDTOs.WorksheetSaveRequest;
import com.livic.finance.service.BillingWorksheetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/billing-worksheets")
public class BillingWorksheetController {

    private final BillingWorksheetService worksheetService;

    @Autowired
    public BillingWorksheetController(BillingWorksheetService worksheetService) {
        this.worksheetService = worksheetService;
    }

    @GetMapping
    @PreAuthorize("@authorizationService.hasPermission(#propertyId, 'PROPERTY_VIEW')")
    public ResponseEntity<ApiResponse<List<WorksheetEntryResponse>>> getOrCreateWorksheet(
            @RequestParam UUID propertyId,
            @RequestParam UUID chargeConfigId,
            @RequestParam String billingMonth) {
        List<WorksheetEntryResponse> responses = worksheetService.getOrCreateWorksheetForMonth(propertyId, chargeConfigId, billingMonth);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping("/batch-save")
    @PreAuthorize("@authorizationService.hasPermission(#request.propertyId, 'PROPERTY_EDIT')")
    public ResponseEntity<ApiResponse<Void>> saveWorksheet(@Valid @RequestBody WorksheetSaveRequest request) {
        worksheetService.saveWorksheet(request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
