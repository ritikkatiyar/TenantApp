package com.tenantliving.finance.repository;

import org.springframework.stereotype.Repository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.UUID;
import java.util.ArrayList;

@Repository
@RequiredArgsConstructor
public class AnalyticsRepository {

    @PersistenceContext
    private final EntityManager entityManager;

    public Object[] getRevenueMetrics(List<UUID> propertyIds, String billingMonth) {
        if (propertyIds == null || propertyIds.isEmpty()) return new Object[]{BigDecimal.ZERO, BigDecimal.ZERO};
        
        String jpql = "SELECT SUM(r.baseAmount), SUM(CASE WHEN r.status = 'PAID' THEN r.totalAmount ELSE 0 END) " +
                      "FROM RentCycleTbl r JOIN r.lease l JOIN l.unit u " +
                      "WHERE u.property.id IN :propertyIds AND r.billingMonth = :billingMonth";
                      
        Query query = entityManager.createQuery(jpql);
        query.setParameter("propertyIds", propertyIds);
        query.setParameter("billingMonth", billingMonth);
        
        Object[] result = (Object[]) query.getSingleResult();
        return result != null && result[0] != null ? result : new Object[]{BigDecimal.ZERO, BigDecimal.ZERO};
    }

    public Map<String, BigDecimal> getOperationalOverhead(List<UUID> propertyIds) {
        Map<String, BigDecimal> overhead = new HashMap<>();
        if (propertyIds == null || propertyIds.isEmpty()) return overhead;

        String jpql = "SELECT e.expenseType, SUM(e.totalAmount) " +
                      "FROM ExpenseTbl e JOIN e.expenseGroup eg JOIN eg.unit u " +
                      "WHERE u.property.id IN :propertyIds " +
                      "GROUP BY e.expenseType";
                      
        Query query = entityManager.createQuery(jpql);
        query.setParameter("propertyIds", propertyIds);
        
        List<Object[]> results = query.getResultList();
        for (Object[] row : results) {
            String type = row[0].toString();
            BigDecimal amount = (BigDecimal) row[1];
            overhead.put(type, amount);
        }
        return overhead;
    }

    public BigDecimal getTotalExpenses(List<UUID> propertyIds) {
        if (propertyIds == null || propertyIds.isEmpty()) return BigDecimal.ZERO;
        
        String jpql = "SELECT SUM(e.totalAmount) " +
                      "FROM ExpenseTbl e JOIN e.expenseGroup eg JOIN eg.unit u " +
                      "WHERE u.property.id IN :propertyIds";
                      
        Query query = entityManager.createQuery(jpql);
        query.setParameter("propertyIds", propertyIds);
        
        BigDecimal result = (BigDecimal) query.getSingleResult();
        return result != null ? result : BigDecimal.ZERO;
    }

    public List<Object[]> getDefaulters(List<UUID> propertyIds) {
        if (propertyIds == null || propertyIds.isEmpty()) return new ArrayList<>();

        String jpql = "SELECT u.user.firstName, u.user.lastName, unit.unitNumber, p.name, r.dueDate, r.totalAmount, r.id " +
                      "FROM RentCycleTbl r JOIN r.lease l JOIN l.unit unit JOIN unit.property p JOIN l.userId userId " +
                      "WHERE p.id IN :propertyIds AND " +
                      "(r.status = 'OVERDUE' OR (r.status = 'PENDING' AND r.dueDate < :currentDate)) " +
                      "ORDER BY r.dueDate ASC";
                      
        // Note: the above query assumes User is linked to userId, but userId is just a UUID on LeaseTbl.
        // We'll need to fetch User details separately or join with UserTbl if it exists.
        // Let's rewrite the query to just return the userId, we'll fetch names in the service.
        String correctJpql = "SELECT l.userId, unit.unitNumber, p.name, r.dueDate, r.totalAmount, r.id " +
                             "FROM RentCycleTbl r JOIN r.lease l JOIN l.unit unit JOIN unit.property p " +
                             "WHERE p.id IN :propertyIds AND " +
                             "(r.status = 'OVERDUE' OR (r.status = 'PENDING' AND r.dueDate < :currentDate)) " +
                             "ORDER BY r.dueDate ASC";

        Query query = entityManager.createQuery(correctJpql);
        query.setParameter("propertyIds", propertyIds);
        query.setParameter("currentDate", LocalDate.now());
        
        return query.getResultList();
    }

    public List<Object[]> getOccupancyByProperty(List<UUID> propertyIds) {
        if (propertyIds == null || propertyIds.isEmpty()) return new ArrayList<>();

        String jpql = "SELECT p.id, p.name, " +
                      "(SELECT COUNT(u) FROM UnitTbl u WHERE u.property.id = p.id), " +
                      "(SELECT COUNT(l) FROM LeaseTbl l JOIN l.unit u WHERE u.property.id = p.id AND l.status = 'ACTIVE') " +
                      "FROM PropertyTbl p WHERE p.id IN :propertyIds";
                      
        Query query = entityManager.createQuery(jpql);
        query.setParameter("propertyIds", propertyIds);
        
        return query.getResultList();
    }
}
