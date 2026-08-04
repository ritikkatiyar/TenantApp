package com.livic.finance.repository;

import com.livic.common.domain.RentCycleStatus;
import com.livic.finance.domain.RentCycleTbl;
import com.livic.finance.dto.RentCycleDashboardDTOs.DefaulterRecordDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface RentCycleRepository extends JpaRepository<RentCycleTbl, UUID>, JpaSpecificationExecutor<RentCycleTbl> {
    Optional<RentCycleTbl> findByLease_IdAndBillingMonth(UUID leaseId, String billingMonth);

    List<RentCycleTbl> findByLease_Id(UUID leaseId);

    List<RentCycleTbl> findByBillingMonth(String billingMonth);

    List<RentCycleTbl> findByLease_IdInAndBillingMonth(Collection<UUID> leaseIds, String billingMonth);

    List<RentCycleTbl> findByLease_Unit_Property_IdAndBillingMonth(UUID propertyId, String billingMonth);

    @Query("SELECT SUM(r.totalAmount), SUM(CASE WHEN r.status = :statusPaid THEN r.totalAmount ELSE 0.0 END) " +
           "FROM RentCycleTbl r JOIN r.lease l JOIN l.unit u " +
           "WHERE u.property.id IN :propertyIds AND r.billingMonth = :billingMonth")
    Object[] calculateRevenueMetrics(
            @Param("propertyIds") Collection<UUID> propertyIds,
            @Param("billingMonth") String billingMonth,
            @Param("statusPaid") RentCycleStatus statusPaid
    );

    @Query("SELECT new com.livic.finance.dto.RentCycleDashboardDTOs$DefaulterRecordDTO(" +
           "l.userId, unit.unitNumber, p.name, r.dueDate, r.totalAmount, r.id) " +
           "FROM RentCycleTbl r JOIN r.lease l JOIN l.unit unit JOIN unit.property p " +
           "WHERE p.id IN :propertyIds AND " +
           "(r.status = :statusOverdue OR (r.status = :statusPending AND r.dueDate < :currentDate)) " +
           "ORDER BY r.dueDate ASC")
    List<DefaulterRecordDTO> findDefaulters(
            @Param("propertyIds") Collection<UUID> propertyIds,
            @Param("statusOverdue") RentCycleStatus statusOverdue,
            @Param("statusPending") RentCycleStatus statusPending,
            @Param("currentDate") LocalDate currentDate
    );
}
