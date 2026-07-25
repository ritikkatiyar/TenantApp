package com.tenantliving.property.service.interfaces;

import java.time.LocalDate;
import java.util.UUID;

public interface UnitAvailabilityService {
    boolean isUnitAvailableOnDate(UUID unitId, LocalDate date);
}
