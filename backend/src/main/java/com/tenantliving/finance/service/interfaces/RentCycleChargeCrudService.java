package com.tenantliving.finance.service.interfaces;

import com.tenantliving.finance.domain.RentCycleChargeTbl;
import com.tenantliving.common.service.interfaces.CrudService;

import java.util.List;
import java.util.UUID;

public interface RentCycleChargeCrudService extends CrudService<RentCycleChargeTbl, UUID> {
    List<RentCycleChargeTbl> findByRentCycle_Id(UUID rentCycleId);
    boolean existsByCustomChargeConfigId(UUID customChargeConfigId);
}
