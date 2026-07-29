package com.livic.finance.service.interfaces;

import com.livic.finance.dto.UnitBookingDTOs;
import com.livic.payment.domain.PaymentTransactionTbl;
import java.math.BigDecimal;
import java.util.UUID;

public interface UnitBookingService {
    UnitBookingDTOs.UnitBookingResponse createBooking(UnitBookingDTOs.CreateBookingRequest request);
    UnitBookingDTOs.UnitBookingResponse forfeitBooking(UUID bookingId, UUID userDetailsId);
    UnitBookingDTOs.UnitBookingResponse refundBooking(UUID bookingId, UUID userDetailsId);
    PaymentTransactionTbl initiateTokenOnlinePayment(UUID bookingId, UUID userDetailsId);
    PaymentTransactionTbl recordTokenCashPayment(UUID bookingId, BigDecimal amount, String note, UUID userDetailsId);
    java.util.List<UnitBookingDTOs.UnitBookingResponse> listBookings();
}
