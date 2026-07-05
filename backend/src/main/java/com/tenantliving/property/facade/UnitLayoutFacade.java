package com.tenantliving.property.facade;

import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.service.interfaces.LeaseQueryService;
import com.tenantliving.property.domain.UnitTbl;
import com.tenantliving.property.dto.UnitDTOs;
import com.tenantliving.property.service.interfaces.UnitService;
import com.tenantliving.property.service.interfaces.UnitQueryService;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Application Service / Facade to orchestrate cross-domain logic between
 * Property, Finance, and User modules for Unit Layouts.
 * This keeps the Controllers thin and Domain Services pure.
 */
@Service
@RequiredArgsConstructor
public class UnitLayoutFacade {

    private final UnitService unitService;
    private final UnitQueryService unitQueryService;
    private final LeaseQueryService leaseQueryService;
    private final UserQueryService userQueryService;

    public List<UnitDTOs.UnitResponse> getFloorLayout(UUID propertyId, int floorNumber) {
        List<UnitTbl> units = unitQueryService.getUnitsByFloor(propertyId, floorNumber);
        return enrichUnits(units);
    }

    public List<UnitDTOs.UnitResponse> getAllFloorsLayout(UUID propertyId) {
        List<UnitTbl> units = unitQueryService.getUnitsByProperty(propertyId);
        return enrichUnits(units);
    }

    public List<UnitDTOs.UnitResponse> saveFloorLayout(
            UUID propertyId,
            int floorNumber,
            List<UnitDTOs.FloorLayoutUnitRequest> items) {
        
        List<UnitTbl> existingUnits = unitQueryService.getUnitsByFloor(propertyId, floorNumber);
        Set<String> incomingNumbers = items.stream()
                .map(UnitDTOs.FloorLayoutUnitRequest::unitNumber)
                .collect(Collectors.toSet());
        
        for (UnitTbl unit : existingUnits) {
            if (!incomingNumbers.contains(unit.getUnitNumber())) {
                if (leaseQueryService.existsByUnitId(unit.getId())) {
                    throw new BusinessException(
                            HttpStatus.CONFLICT,
                            "Cannot remove unit " + unit.getUnitNumber() + " from the layout while leases reference it"
                    );
                }
            }
        }

        List<UnitTbl> saved = unitService.saveFloorLayout(propertyId, floorNumber, items);
        return enrichUnits(saved);
    }

    private List<UnitDTOs.UnitResponse> enrichUnits(List<UnitTbl> units) {
        Map<UUID, List<LeaseTbl>> activeLeasesByUnitId = leaseQueryService.findActiveLeasesByUnitIds(
                units.stream().map(UnitTbl::getId).collect(Collectors.toSet())
        );
        Map<UUID, UserTbl> usersById = userQueryService.getUsersByIds(
                activeLeasesByUnitId.values().stream()
                        .flatMap(List::stream)
                        .map(LeaseTbl::getUserId)
                        .collect(Collectors.toSet())
        );

        return units.stream()
                .map(unit -> toResponse(unit, activeLeasesByUnitId.getOrDefault(unit.getId(), List.of()), usersById))
                .collect(Collectors.toList());
    }

    private UnitDTOs.UnitResponse toResponse(UnitTbl u, List<LeaseTbl> leases, Map<UUID, UserTbl> usersById) {
        return new UnitDTOs.UnitResponse(
                u.getId(),
                u.getUnitNumber(),
                u.getFloor(),
                u.getGridX(),
                u.getGridY(),
                u.getGridWidth(),
                u.getGridHeight(),
                u.getType(),
                u.getCapacity(),
                u.getFacing(),
                toActiveLeaseSummaries(leases, usersById)
        );
    }

    private List<UnitDTOs.ActiveLeaseSummary> toActiveLeaseSummaries(List<LeaseTbl> leases, Map<UUID, UserTbl> usersById) {
        return leases.stream()
                .map(l -> {
                    UserTbl user = usersById.get(l.getUserId());
                    return new UnitDTOs.ActiveLeaseSummary(
                            l.getId(),
                            l.getUserId(),
                            user != null ? user.getFullName() : "Unknown User",
                            user != null ? user.getPhoneNumber() : "",
                            l.getStatus() != null ? l.getStatus().name() : "ACTIVE"
                    );
                })
                .collect(Collectors.toList());
    }
}
