package com.livic.finance.controller;

import com.livic.finance.service.interfaces.PaymentStatementService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/finance/payments")
@RequiredArgsConstructor
@Slf4j
public class InvoiceController {

    private final PaymentStatementService paymentStatementService;

    @GetMapping(value = "/rent-cycles/{rentCycleId}/invoice", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getPaymentStatementHtml(
            @PathVariable UUID rentCycleId,
            @RequestParam(required = false) String token,
            HttpServletRequest request
    ) {
        log.info("API request: Get payment statement HTML for RentCycle: {}", rentCycleId);
        String authHeader = request.getHeader("Authorization");
        String html = paymentStatementService.generateStatementHtml(rentCycleId, token, authHeader);
        return ResponseEntity.ok(html);
    }
}
