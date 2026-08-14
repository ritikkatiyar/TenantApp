package com.livic.finance.service.interfaces;

import com.livic.common.domain.RentCycleStatus;
import com.livic.finance.dto.RentCycleDTOs;
import com.livic.payment.dto.PaymentInitiationResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import java.util.Map;
import java.time.LocalDate;
import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.domain.RentCycleTbl;

public interface RentCycleService {
    RentCycleDTOs.RentCycleResponse generate(RentCycleDTOs.GenerateRentCycleRequest request);

    RentCycleDTOs.BatchGenerateResult batchGenerate(RentCycleDTOs.BatchGenerateRentCycleRequest request);

    RentCycleDTOs.PreFlightChecklistResponse getPreFlightChecklist(UUID propertyId, String billingMonth);

    RentCycleDTOs.RentCycleListResponse list(UUID currentUserId, UUID propertyId, UUID leaseId, String billingMonth, RentCycleStatus status, Pageable pageable);

    RentCycleDTOs.RentCycleResponse markPaid(UUID id);

    RentCycleDTOs.RentCycleResponse publish(UUID id);

    RentCycleDTOs.RentCycleResponse unpublish(UUID id);

    RentCycleDTOs.BatchPublishResult batchPublish(UUID propertyId, String billingMonth);

    RentCycleDTOs.BatchUnpublishResult batchUnpublish(UUID propertyId, String billingMonth);

    PaymentInitiationResponse initiateOnlinePayment(UUID rentCycleId, UUID payerUserId);

    PaymentInitiationResponse recordCashPayment(UUID rentCycleId, BigDecimal amount, String note, UUID payerUserId, UUID confirmedBy);

    RentCycleTbl generateSingleInTransaction(LeaseTbl lease, String billingMonth, LocalDate dueDate, Map<UUID, Integer> roommateCounts);

    RentCycleDTOs.RentCycleResponse publishSingleInTransaction(UUID id);

    RentCycleDTOs.RentCycleResponse unpublishSingleInTransaction(UUID id);
}
