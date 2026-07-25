package com.tenantliving.finance.event;

import com.tenantliving.common.event.PaymentConfirmedEvent;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.finance.domain.UnitBookingTbl;
import com.tenantliving.finance.service.interfaces.UnitBookingCrudService;
import com.tenantliving.payment.domain.PaymentTransactionTbl;
import com.tenantliving.payment.service.interfaces.PaymentTransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
@Slf4j
public class UnitBookingPaymentConfirmedListener {

    private final UnitBookingCrudService unitBookingCrudService;
    private final PaymentTransactionService paymentTransactionService;

    @EventListener
    @Transactional
    public void onPaymentConfirmed(PaymentConfirmedEvent event) {
        if (!"UNIT_BOOKING".equals(event.getReferenceType())) {
            return;
        }

        log.info("Processing confirmed token payment for UnitBooking: {}, amount: {}", event.getReferenceId(), event.getAmount());

        UnitBookingTbl booking = unitBookingCrudService.findById(event.getReferenceId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Unit booking not found"));

        PaymentTransactionTbl transaction = paymentTransactionService.findTransactionById(event.getPaymentTransactionId())
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "Payment transaction not found"));

        booking.setPaymentTransaction(transaction);
        unitBookingCrudService.save(booking);

        log.info("Successfully updated booking: {} with payment transaction ID: {}", booking.getId(), transaction.getId());
    }
}
