package com.tenantliving.finance.repository;

import com.tenantliving.finance.domain.FinanceLedgerTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface FinanceLedgerRepository extends JpaRepository<FinanceLedgerTbl, UUID> {
}
