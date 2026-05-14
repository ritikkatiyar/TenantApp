package com.tenantliving.rentcycle.service.interfaces;

import com.tenantliving.common.domain.RentCycleStatus;
import com.tenantliving.rentcycle.dto.RentCycleDTOs;

import java.util.List;
import java.util.UUID;

public interface RentCycleService {
    RentCycleDTOs.RentCycleResponse generate(RentCycleDTOs.GenerateRentCycleRequest request);

    List<RentCycleDTOs.RentCycleResponse> list(UUID leaseId, String billingMonth, RentCycleStatus status);

    RentCycleDTOs.RentCycleResponse markPaid(UUID id);
}
