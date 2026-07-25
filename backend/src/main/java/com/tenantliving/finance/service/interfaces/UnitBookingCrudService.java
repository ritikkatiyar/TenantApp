package com.tenantliving.finance.service.interfaces;

import com.tenantliving.common.service.interfaces.CrudService;
import com.tenantliving.finance.domain.UnitBookingTbl;
import java.util.Optional;
import java.util.UUID;

public interface UnitBookingCrudService extends CrudService<UnitBookingTbl, UUID> {
    Optional<UnitBookingTbl> findByStatusAndConvertedLeaseId(String status, UUID convertedLeaseId);
}
