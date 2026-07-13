package com.tenantliving.finance.repository;

import com.tenantliving.finance.domain.FinanceLedgerTbl;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Repository
public interface FinanceLedgerRepository extends JpaRepository<FinanceLedgerTbl, UUID>, JpaSpecificationExecutor<FinanceLedgerTbl> {
    
    @Query("SELECT COALESCE(SUM(l.amount), 0) FROM FinanceLedgerTbl l WHERE l.lease.id = :leaseId AND (l.createdAt < :createdAt OR (l.createdAt = :createdAt AND l.id <= :id))")
    BigDecimal getRunningBalanceForLeaseAtEntry(@Param("leaseId") UUID leaseId, @Param("createdAt") LocalDateTime createdAt, @Param("id") UUID id);
}
