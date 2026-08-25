package com.livic.finance.service.interfaces;

import com.livic.finance.dto.UnitBookingDTOs;
import com.livic.payment.dto.PaymentTransactionResponse;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface UnitBookingService {
    UnitBookingDTOs.UnitBookingResponse createBooking(UnitBookingDTOs.CreateBookingRequest request);
    UnitBookingDTOs.UnitBookingResponse forfeitBooking(UUID bookingId, UUID userDetailsId);
    UnitBookingDTOs.UnitBookingResponse refundBooking(UUID bookingId, UUID userDetailsId);
    PaymentTransactionResponse initiateTokenOnlinePayment(UUID bookingId, UUID userDetailsId);
    PaymentTransactionResponse recordTokenCashPayment(UUID bookingId, BigDecimal amount, String note, UUID userDetailsId);
    List<UnitBookingDTOs.UnitBookingResponse> listBookings();
    List<UnitBookingDTOs.UnitBookingResponse> listBookings(UUID currentUserId, UUID propertyId);
}
