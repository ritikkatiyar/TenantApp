package com.livic.finance.service.interfaces;

import com.livic.finance.domain.RentCycleChargeTbl;
import com.livic.common.service.interfaces.CrudService;

import java.util.List;
import java.util.UUID;

public interface RentCycleChargeCrudService extends CrudService<RentCycleChargeTbl, UUID> {
    List<RentCycleChargeTbl> findByRentCycle_Id(UUID rentCycleId);
    boolean existsByCustomChargeConfigId(UUID customChargeConfigId);
}
