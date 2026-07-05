package com.tenantliving.finance.service.interfaces;

import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.dto.LeaseDTOs;
import java.util.UUID;

public interface LeaseService {
    LeaseTbl createLease(LeaseDTOs.CreateLeaseRequest request);
    LeaseTbl createLease(LeaseDTOs.CreateLeaseRequest request, UUID assignedByUserId);
    void deleteLease(UUID id);
}
