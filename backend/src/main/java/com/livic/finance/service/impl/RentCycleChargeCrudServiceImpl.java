package com.livic.finance.service.impl;

import com.livic.common.service.impl.AbstractCrudService;
import com.livic.finance.domain.RentCycleChargeTbl;
import com.livic.finance.repository.RentCycleChargeRepository;
import com.livic.finance.service.interfaces.RentCycleChargeCrudService;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
public class RentCycleChargeCrudServiceImpl extends AbstractCrudService<RentCycleChargeTbl, UUID, RentCycleChargeRepository> implements RentCycleChargeCrudService {

    public RentCycleChargeCrudServiceImpl(RentCycleChargeRepository repository) {
        super(repository);
    }

    @Override
    public List<RentCycleChargeTbl> findByRentCycle_Id(UUID rentCycleId) {
        return repository.findByRentCycle_Id(rentCycleId);
    }

    @Override
    public boolean existsByCustomChargeConfigId(UUID customChargeConfigId) {
        return repository.existsByCustomChargeConfigId(customChargeConfigId);
    }
}
