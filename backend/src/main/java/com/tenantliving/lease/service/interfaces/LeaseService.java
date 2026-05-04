package com.tenantliving.lease.service.interfaces;

import com.tenantliving.lease.domain.LeaseTbl;
import java.util.UUID;

public interface LeaseService {
    LeaseTbl getLeaseById(UUID id);
}
