package com.livic.finance.controller;

import com.livic.finance.service.interfaces.PaymentStatementService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/rent-cycles")
@RequiredArgsConstructor
@Slf4j
public class InvoiceController {

    private final PaymentStatementService paymentStatementService;

    @GetMapping(value = "/{rentCycleId}/invoice", produces = MediaType.TEXT_HTML_VALUE)
    @PreAuthorize("@authorizationService.hasPermissionByRentCycleId(#rentCycleId, 'LEASE_VIEW') or @authorizationService.hasPermissionByRentCycleId(#rentCycleId, 'LEASE_VIEW_OWN') or hasAnyRole('TENANT', 'LANDLORD', 'ADMIN', 'SUPERADMIN')")
    public ResponseEntity<String> getPaymentStatementHtml(@PathVariable UUID rentCycleId) {
        log.info("API request: Get payment statement HTML for RentCycle: {}", rentCycleId);
        String html = paymentStatementService.generateStatementHtml(rentCycleId);
        return ResponseEntity.ok(html);
    }
}
