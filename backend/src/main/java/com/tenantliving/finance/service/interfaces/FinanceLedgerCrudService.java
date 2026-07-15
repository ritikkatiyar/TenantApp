package com.tenantliving.finance.service.interfaces;

import com.tenantliving.finance.domain.FinanceLedgerTbl;
import com.tenantliving.common.service.interfaces.CrudService;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface FinanceLedgerCrudService extends CrudService<FinanceLedgerTbl, UUID> {
    BigDecimal getRunningBalanceForLeaseAtEntry(UUID leaseId, LocalDateTime createdAt, UUID id);
    List<Object[]> getRunningBalancesForEntries(Collection<UUID> ids);
}
