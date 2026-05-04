package com.tenantliving.lease.service.impl;

import com.tenantliving.lease.domain.LeaseTbl;
import com.tenantliving.lease.repository.LeaseRepository;
import com.tenantliving.lease.service.interfaces.LeaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LeaseServiceImpl implements LeaseService {

    private final LeaseRepository leaseRepository;

    @Override
    public LeaseTbl getLeaseById(UUID id) {
        return leaseRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Lease not found with id: " + id));
    }
}
