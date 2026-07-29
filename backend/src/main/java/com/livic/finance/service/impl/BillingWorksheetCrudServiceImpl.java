package com.livic.finance.service.impl;

import com.livic.common.service.impl.AbstractCrudService;
import com.livic.finance.domain.BillingWorksheetEntryTbl;
import com.livic.finance.repository.BillingWorksheetRepository;
import com.livic.finance.service.interfaces.BillingWorksheetCrudService;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class BillingWorksheetCrudServiceImpl extends AbstractCrudService<BillingWorksheetEntryTbl, UUID, BillingWorksheetRepository> implements BillingWorksheetCrudService {

    public BillingWorksheetCrudServiceImpl(BillingWorksheetRepository repository) {
        super(repository);
    }

    @Override
    public List<BillingWorksheetEntryTbl> findAllByPropertyIdAndChargeConfigIdAndBillingMonth(
            UUID propertyId, UUID chargeConfigId, String billingMonth) {
        return repository.findAllByPropertyIdAndChargeConfigIdAndBillingMonth(propertyId, chargeConfigId, billingMonth);
    }

    @Override
    public Optional<BillingWorksheetEntryTbl> findByUnitIdAndChargeConfigIdAndBillingMonth(
            UUID unitId, UUID chargeConfigId, String billingMonth) {
        return repository.findByUnitIdAndChargeConfigIdAndBillingMonth(unitId, chargeConfigId, billingMonth);
    }

    @Override
    public Optional<BillingWorksheetEntryTbl> findTopByUnitIdAndChargeConfigIdOrderByBillingMonthDesc(
            UUID unitId, UUID chargeConfigId) {
        return repository.findTopByUnitIdAndChargeConfigIdOrderByBillingMonthDesc(unitId, chargeConfigId);
    }

    @Override
    public List<BillingWorksheetEntryTbl> findAllByUnitIdAndBillingMonth(UUID unitId, String billingMonth) {
        return repository.findAllByUnitIdAndBillingMonth(unitId, billingMonth);
    }

    @Override
    public List<BillingWorksheetEntryTbl> findAllByPropertyIdAndBillingMonth(UUID propertyId, String billingMonth) {
        return repository.findAllByPropertyIdAndBillingMonth(propertyId, billingMonth);
    }

    @Override
    public boolean existsByChargeConfigId(UUID chargeConfigId) {
        return repository.existsByChargeConfigId(chargeConfigId);
    }

    @Override
    public List<Object[]> findLatestValuesForPropertyAndConfig(UUID propertyId, UUID chargeConfigId, String billingMonth) {
        return repository.findLatestValuesForPropertyAndConfig(propertyId, chargeConfigId, billingMonth);
    }

    @Override
    public List<BillingWorksheetEntryTbl> findByUnitIdInAndChargeConfigIdAndBillingMonth(Collection<UUID> unitIds, UUID chargeConfigId, String billingMonth) {
        return repository.findByUnitIdInAndChargeConfigIdAndBillingMonth(unitIds, chargeConfigId, billingMonth);
    }
}
