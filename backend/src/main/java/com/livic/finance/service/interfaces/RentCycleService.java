package com.livic.finance.service.interfaces;

import com.livic.common.domain.RentCycleStatus;
import com.livic.finance.dto.RentCycleDTOs;
import com.livic.payment.dto.PaymentInitiationResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface RentCycleService {
    RentCycleDTOs.RentCycleResponse generate(RentCycleDTOs.GenerateRentCycleRequest request);

    List<RentCycleDTOs.RentCycleResponse> batchGenerate(RentCycleDTOs.BatchGenerateRentCycleRequest request);

    RentCycleDTOs.PreFlightChecklistResponse getPreFlightChecklist(UUID propertyId, String billingMonth);

    Page<RentCycleDTOs.RentCycleResponse> list(UUID currentUserId, UUID leaseId, String billingMonth, RentCycleStatus status, Pageable pageable);

    RentCycleDTOs.RentCycleResponse markPaid(UUID id);

    List<RentCycleDTOs.RentCycleResponse> batchPublish(UUID propertyId, String billingMonth);

    List<RentCycleDTOs.RentCycleResponse> batchUnpublish(UUID propertyId, String billingMonth);

    PaymentInitiationResponse initiateOnlinePayment(UUID rentCycleId, UUID payerUserId);

    PaymentInitiationResponse recordCashPayment(UUID rentCycleId, BigDecimal amount, String note, UUID payerUserId, UUID confirmedBy);
}
