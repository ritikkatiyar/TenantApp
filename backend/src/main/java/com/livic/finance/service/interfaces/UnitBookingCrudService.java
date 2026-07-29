package com.livic.finance.service.interfaces;

import com.livic.common.service.interfaces.CrudService;
import com.livic.finance.domain.UnitBookingTbl;
import java.util.Optional;
import java.util.UUID;

public interface UnitBookingCrudService extends CrudService<UnitBookingTbl, UUID> {
    Optional<UnitBookingTbl> findByStatusAndConvertedLeaseId(String status, UUID convertedLeaseId);
}
