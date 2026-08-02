package com.livic.finance.service.interfaces;

import com.livic.common.service.interfaces.CrudService;
import com.livic.finance.domain.RentCycleTbl;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RentCycleCrudService extends CrudService<RentCycleTbl, UUID> {
    Optional<RentCycleTbl> findByLease_IdAndBillingMonth(UUID leaseId, String billingMonth);
    List<RentCycleTbl> findByLease_Id(UUID leaseId);
    List<RentCycleTbl> findByLease_IdInAndBillingMonth(List<UUID> leaseIds, String billingMonth);
    List<RentCycleTbl> findByBillingMonth(String billingMonth);
    List<RentCycleTbl> findByPropertyIdAndBillingMonth(UUID propertyId, String billingMonth);
    Page<RentCycleTbl> findAll(Specification<RentCycleTbl> spec, Pageable pageable);
    List<RentCycleTbl> findAll(Specification<RentCycleTbl> spec);
}
