package com.livic.finance.event;

import com.livic.common.domain.LedgerTransactionType;
import com.livic.common.domain.RentCycleStatus;
import com.livic.common.event.PaymentConfirmedEvent;
import com.livic.common.exception.BusinessException;
import com.livic.finance.domain.FinanceLedgerTbl;
import com.livic.finance.domain.RentCycleTbl;
import com.livic.finance.service.interfaces.FinanceLedgerCrudService;
import com.livic.finance.service.interfaces.RentCycleCrudService;
import com.livic.payment.domain.PaymentTransactionTbl;
import com.livic.payment.service.interfaces.PaymentTransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
@Slf4j
public class RentPaymentConfirmedListener {

    private final RentCycleCrudService rentCycleCrudService;
    private final PaymentTransactionService paymentTransactionService;
    private final FinanceLedgerCrudService financeLedgerCrudService;

    @EventListener
    @Transactional
    public void onPaymentConfirmed(PaymentConfirmedEvent event) {
        if (!"RENT_CYCLE".equals(event.getReferenceType())) {
            return;
        }

        log.info("Processing confirmed rent payment for RentCycle: {}, amount: {}", event.getReferenceId(), event.getAmount());

        RentCycleTbl rentCycle = rentCycleCrudService.findById(event.getReferenceId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Rent cycle not found"));

        // 1. Check partial payment rules
        boolean allowPartial = rentCycle.getLease().getUnit().getProperty().isAllowPartialPayment();
        BigDecimal remaining = rentCycle.getTotalAmount().subtract(rentCycle.getAmountPaid());
        
        if (!allowPartial && event.getAmount().compareTo(remaining) < 0) {
            log.error("Partial payment not allowed for property on rent cycle: {}", rentCycle.getId());
            throw new BusinessException(HttpStatus.BAD_REQUEST, "Partial payments are disabled for this property");
        }

        // 2. Load and link Payment Transaction
        PaymentTransactionTbl transaction = paymentTransactionService.findTransactionById(event.getPaymentTransactionId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Payment transaction not found"));

        // 3. Update Rent Cycle amount paid & status
        BigDecimal newAmountPaid = rentCycle.getAmountPaid().add(event.getAmount());
        rentCycle.setAmountPaid(newAmountPaid);
        rentCycle.setPaymentTransaction(transaction);

        if (newAmountPaid.compareTo(rentCycle.getTotalAmount()) >= 0) {
            rentCycle.setStatus(RentCycleStatus.PAID);
            rentCycle.setPaidAt(LocalDateTime.now());
        } else {
            rentCycle.setStatus(RentCycleStatus.PARTIALLY_PAID);
        }
        rentCycleCrudService.save(rentCycle);

        // 4. Update Ledger
        BigDecimal currentBalance = financeLedgerCrudService.sumAmountByLeaseId(rentCycle.getLease().getId());
        // Payments reduce tenant's balance, so amount is negative
        BigDecimal ledgerAmount = event.getAmount().negate();
        BigDecimal newBalance = currentBalance.add(ledgerAmount);

        boolean isFullPayment = rentCycle.getStatus() == RentCycleStatus.PAID;
        String description = isFullPayment ? "Rent Payment (Full)" : "Rent Payment (Partial)";

        FinanceLedgerTbl ledgerEntry = FinanceLedgerTbl.builder()
                .unit(rentCycle.getLease().getUnit())
                .lease(rentCycle.getLease())
                .transactionType(LedgerTransactionType.PAYMENT_RECEIVED)
                .amount(ledgerAmount)
                .balance(newBalance)
                .referenceId(event.getPaymentTransactionId())
                .description(description + " via " + event.getPaymentMethod())
                .build();

        financeLedgerCrudService.save(ledgerEntry);
        log.info("Successfully updated rent cycle and recorded ledger entry for payment transaction: {}", event.getPaymentTransactionId());
    }
}
