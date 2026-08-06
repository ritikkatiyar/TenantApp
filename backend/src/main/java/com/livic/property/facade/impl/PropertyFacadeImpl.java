package com.livic.property.facade.impl;

import com.livic.common.domain.LeaseStatus;
import com.livic.property.dto.PropertySummaryDTO;
import com.livic.property.dto.UnitSummaryDTO;
import com.livic.property.facade.PropertyFacade;
import com.livic.property.service.interfaces.PropertyQueryService;
import com.livic.property.service.interfaces.UnitAvailabilityService;
import com.livic.property.service.interfaces.UnitCrudService;
import com.livic.property.service.interfaces.UnitQueryService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
@SuppressWarnings("unchecked")
public class PropertyFacadeImpl implements PropertyFacade {

    @PersistenceContext
    private EntityManager entityManager;

    private final PropertyQueryService propertyQueryService;
    private final UnitQueryService unitQueryService;
    private final UnitCrudService unitCrudService;
    private final UnitAvailabilityService unitAvailabilityService;

    @Override
    public Optional<PropertySummaryDTO> getPropertyById(UUID propertyId) {
        try {
            return Optional.ofNullable(PropertySummaryDTO.from(propertyQueryService.getPropertyById(propertyId)));
        } catch (Exception e) {
            return Optional.empty();
        }
    }

    @Override
    public List<PropertySummaryDTO> getPropertiesByUserId(UUID userId) {
        return propertyQueryService.getPropertiesByUserId(userId).stream()
                .map(PropertySummaryDTO::from)
                .toList();
    }

    @Override
    public List<PropertySummaryDTO> getPropertiesByAutoBillDayOfMonth(int day) {
        return propertyQueryService.getPropertiesByAutoBillDayOfMonth(day).stream()
                .map(PropertySummaryDTO::from)
                .toList();
    }

    @Override
    public Optional<UnitSummaryDTO> getUnitById(UUID unitId) {
        return unitCrudService.findById(unitId)
                .map(UnitSummaryDTO::from);
    }

    @Override
    public List<UnitSummaryDTO> getUnitsByPropertyId(UUID propertyId) {
        return unitQueryService.getUnitsByProperty(propertyId).stream()
                .map(UnitSummaryDTO::from)
                .toList();
    }

    @Override
    public List<UnitSummaryDTO> getUnitsByFloor(UUID propertyId, int floorNumber) {
        return unitQueryService.getUnitsByFloor(propertyId, floorNumber).stream()
                .map(UnitSummaryDTO::from)
                .toList();
    }

    @Override
    public boolean isUnitAvailableOnDate(UUID unitId, LocalDate date) {
        return unitAvailabilityService.isUnitAvailableOnDate(unitId, date);
    }

    @Override
    public boolean existsPropertyById(UUID propertyId) {
        return propertyQueryService.existsById(propertyId);
    }

    @Override
    public boolean existsUnitById(UUID unitId) {
        return unitCrudService.existsById(unitId);
    }

    @Override
    public List<PropertyOccupancySummaryDTO> getOccupancyByProperty(List<UUID> propertyIds) {
        if (propertyIds == null || propertyIds.isEmpty()) {
            return Collections.emptyList();
        }

        String jpql = "SELECT p.id, p.name, " +
                      "(SELECT COUNT(u) FROM UnitTbl u WHERE u.property.id = p.id), " +
                      "(SELECT COUNT(l) FROM LeaseTbl l JOIN l.unit u WHERE u.property.id = p.id AND l.status = :statusActive) " +
                      "FROM PropertyTbl p WHERE p.id IN :propertyIds";

        Query query = entityManager.createQuery(jpql);
        query.setParameter("propertyIds", propertyIds);
        query.setParameter("statusActive", LeaseStatus.ACTIVE);

        List<Object[]> rows = query.getResultList();
        List<PropertyOccupancySummaryDTO> result = new ArrayList<>();
        for (Object[] row : rows) {
            UUID propId = (UUID) row[0];
            String propName = (String) row[1];
            int totalUnits = ((Number) row[2]).intValue();
            int occupiedUnits = ((Number) row[3]).intValue();

            result.add(new PropertyOccupancySummaryDTO(propId, propName, totalUnits, occupiedUnits));
        }
        return result;
    }
}
