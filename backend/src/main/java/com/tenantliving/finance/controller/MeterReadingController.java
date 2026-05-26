package com.tenantliving.finance.controller;

import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.finance.dto.MeterReadingDTOs.MeterReadingRequest;
import com.tenantliving.finance.dto.MeterReadingDTOs.MeterReadingResponse;
import com.tenantliving.finance.service.MeterReadingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/meter-readings")
public class MeterReadingController {

    private final MeterReadingService meterReadingService;

    @Autowired
    public MeterReadingController(MeterReadingService meterReadingService) {
        this.meterReadingService = meterReadingService;
    }

    @GetMapping("/worksheet")
    public ResponseEntity<ApiResponse<List<MeterReadingResponse>>> getOrCreateMeterReadings(
            @RequestParam UUID propertyId,
            @RequestParam UUID chargeConfigId,
            @RequestParam Integer month,
            @RequestParam Integer year) {
        List<MeterReadingResponse> responses = meterReadingService.getOrCreateMeterReadingsForMonth(propertyId, chargeConfigId, month, year);
        return ResponseEntity.ok(ApiResponse.success(responses));
    }

    @PostMapping("/batch-save")
    public ResponseEntity<ApiResponse<Void>> saveMeterReadings(@RequestBody MeterReadingRequest request) {
        meterReadingService.saveMeterReadings(request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
