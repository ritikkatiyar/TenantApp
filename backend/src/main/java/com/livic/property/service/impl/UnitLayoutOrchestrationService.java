package com.livic.property.service.impl;

import com.livic.common.exception.BusinessException;
import com.livic.finance.dto.LeaseSummaryDTO;
import com.livic.finance.facade.FinanceFacade;
import com.livic.property.domain.UnitTbl;
import com.livic.property.dto.UnitDTOs;
import com.livic.property.service.interfaces.UnitService;
import com.livic.property.service.interfaces.UnitQueryService;
import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Application Service to orchestrate cross-domain logic between
 * Property, Finance, and User modules for Unit Layouts.
 * This keeps the Controllers thin and Domain Services pure.
 */
@Service
@RequiredArgsConstructor
public class UnitLayoutOrchestrationService {

    private final UnitService unitService;
    private final UnitQueryService unitQueryService;
    private final FinanceFacade financeFacade;
    private final UserFacade userFacade;

    public List<UnitDTOs.UnitResponse> getFloorLayout(UUID propertyId, int floorNumber) {
        List<UnitTbl> units = unitQueryService.getUnitsByFloor(propertyId, floorNumber);
        return enrichUnits(units);
    }

    public List<UnitDTOs.UnitResponse> getAllFloorsLayout(UUID propertyId) {
        List<UnitTbl> units = unitQueryService.getUnitsByProperty(propertyId);
        return enrichUnits(units);
    }

    public List<UnitDTOs.UnitResponse> getVacatingUnits(UUID propertyId) {
        List<LeaseSummaryDTO> activeLeases = financeFacade.getActiveLeasesByPropertyId(propertyId);
        Set<UUID> vacatingUnitIds = activeLeases.stream()
                .filter(lease -> lease.moveOutDate() != null && lease.unitId() != null)
                .map(LeaseSummaryDTO::unitId)
                .collect(Collectors.toSet());

        List<UnitTbl> units = unitQueryService.getUnitsByProperty(propertyId).stream()
                .filter(unit -> vacatingUnitIds.contains(unit.getId()))
                .collect(Collectors.toList());
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
                if (financeFacade.hasLeasesForUnit(unit.getId())) {
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
        Map<UUID, List<LeaseSummaryDTO>> activeLeasesByUnitId = financeFacade.getActiveLeasesByUnitIds(
                units.stream().map(UnitTbl::getId).collect(Collectors.toSet())
        );
        Map<UUID, UserSummaryDTO> usersById = userFacade.getUsersByIds(
                activeLeasesByUnitId.values().stream()
                        .flatMap(List::stream)
                        .map(LeaseSummaryDTO::userId)
                        .collect(Collectors.toSet())
        );

        return units.stream()
                .map(unit -> toResponse(unit, activeLeasesByUnitId.getOrDefault(unit.getId(), List.of()), usersById))
                .collect(Collectors.toList());
    }

    private UnitDTOs.UnitResponse toResponse(UnitTbl u, List<LeaseSummaryDTO> leases, Map<UUID, UserSummaryDTO> usersById) {
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

    private List<UnitDTOs.ActiveLeaseSummary> toActiveLeaseSummaries(List<LeaseSummaryDTO> leases, Map<UUID, UserSummaryDTO> usersById) {
        return leases.stream()
                .map(l -> {
                    UserSummaryDTO user = usersById.get(l.userId());
                    return new UnitDTOs.ActiveLeaseSummary(
                            l.id(),
                            l.userId(),
                            user != null ? user.fullName() : "Unknown User",
                            user != null ? user.phoneNumber() : "",
                            l.rentAmount(),
                            l.status() != null ? l.status() : "ACTIVE"
                    );
                })
                .collect(Collectors.toList());
    }
}
