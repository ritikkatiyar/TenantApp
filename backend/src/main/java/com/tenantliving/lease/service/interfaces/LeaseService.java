package com.tenantliving.lease.service.interfaces;

import com.tenantliving.lease.domain.LeaseTbl;
import com.tenantliving.lease.dto.LeaseDTOs;

import java.util.UUID;

public interface LeaseService {
    LeaseTbl createLease(LeaseDTOs.CreateLeaseRequest request);

    LeaseTbl getLeaseById(UUID id);
}
