package com.tenantliving.finance.service.interfaces;

import com.tenantliving.common.domain.RentCycleStatus;
import com.tenantliving.finance.dto.RentCycleDTOs;

import java.util.List;
import java.util.UUID;

public interface RentCycleService {
    RentCycleDTOs.RentCycleResponse generate(RentCycleDTOs.GenerateRentCycleRequest request);

    List<RentCycleDTOs.RentCycleResponse> batchGenerate(RentCycleDTOs.BatchGenerateRentCycleRequest request);

    RentCycleDTOs.PreFlightChecklistResponse getPreFlightChecklist(UUID propertyId, String billingMonth);

    List<RentCycleDTOs.RentCycleResponse> list(UUID leaseId, String billingMonth, RentCycleStatus status);

    RentCycleDTOs.RentCycleResponse markPaid(UUID id);

    List<RentCycleDTOs.RentCycleResponse> batchPublish(UUID propertyId, String billingMonth);
}
