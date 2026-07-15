package com.tenantliving.finance.service.interfaces;

import com.tenantliving.finance.domain.FinanceLedgerTbl;
import com.tenantliving.common.service.interfaces.CrudService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface FinanceLedgerCrudService extends CrudService<FinanceLedgerTbl, UUID> {
    Page<FinanceLedgerTbl> findAll(Specification<FinanceLedgerTbl> spec, Pageable pageable);
    BigDecimal getRunningBalanceForLeaseAtEntry(UUID leaseId, LocalDateTime createdAt, UUID id);
    List<Object[]> getRunningBalancesForEntries(Collection<UUID> ids);
}
