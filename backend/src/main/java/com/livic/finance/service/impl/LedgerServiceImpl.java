package com.livic.finance.service.impl;

import com.livic.finance.domain.FinanceLedgerTbl;
import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.dto.LedgerDTOs.LedgerEntryResponse;
import com.livic.finance.service.interfaces.FinanceLedgerCrudService;
import com.livic.finance.specification.FinanceLedgerSpecifications;
import com.livic.finance.service.interfaces.LedgerService;
import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LedgerServiceImpl implements LedgerService {

    private final FinanceLedgerCrudService financeLedgerCrudService;
    private final UserFacade userFacade;

    @Override
    @Transactional(readOnly = true)
    public Page<LedgerEntryResponse> getLedgerForProperty(UUID propertyId, LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable) {
        Specification<FinanceLedgerTbl> spec = Specification
                .where(FinanceLedgerSpecifications.hasPropertyId(propertyId))
                .and(FinanceLedgerSpecifications.createdAfter(fromDate))
                .and(FinanceLedgerSpecifications.createdBefore(toDate));

        Page<FinanceLedgerTbl> entriesPage = financeLedgerCrudService.findAll(spec, pageable);

        // Batch fetch tenant users to avoid N+1 query
        Set<UUID> userIds = entriesPage.getContent().stream()
                .map(FinanceLedgerTbl::getLease)
                .filter(Objects::nonNull)
                .map(LeaseTbl::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, UserSummaryDTO> usersMap = userFacade.getUsersByIds(userIds);

        // Batch fetch running balances to avoid N+1 query
        List<UUID> entryIds = entriesPage.getContent().stream()
                .map(FinanceLedgerTbl::getId)
                .collect(Collectors.toList());

        Map<UUID, BigDecimal> runningBalancesMap = java.util.Collections.emptyMap();
        if (!entryIds.isEmpty()) {
            runningBalancesMap = financeLedgerCrudService.getRunningBalancesForEntries(entryIds).stream()
                    .filter(row -> row[0] != null)
                    .collect(Collectors.toMap(
                            row -> {
                                if (row[0] instanceof UUID) return (UUID) row[0];
                                return UUID.fromString(row[0].toString());
                            },
                            row -> {
                                if (row[1] == null) return BigDecimal.ZERO;
                                if (row[1] instanceof BigDecimal) return (BigDecimal) row[1];
                                if (row[1] instanceof Number) return BigDecimal.valueOf(((Number) row[1]).doubleValue());
                                return new BigDecimal(row[1].toString());
                            },
                            (existing, replacement) -> existing
                    ));
        }

        final Map<UUID, BigDecimal> finalRunningBalancesMap = runningBalancesMap;

        return entriesPage.map(entry -> {
            String tenantName = "N/A";
            LeaseTbl lease = entry.getLease();
            if (lease != null && lease.getUserId() != null) {
                UserSummaryDTO tenant = usersMap.get(lease.getUserId());
                if (tenant != null) {
                    tenantName = tenant.fullName();
                } else {
                    log.warn("Tenant user not found for lease userId: {}", lease.getUserId());
                }
            }

            // Compute running cumulative balance for this lease at this entry
            BigDecimal runningBalance = entry.getAmount();
            if (lease != null) {
                BigDecimal balance = finalRunningBalancesMap.get(entry.getId());
                if (balance != null) {
                    runningBalance = balance;
                }
            }

            return LedgerEntryResponse.builder()
                    .id(entry.getId())
                    .unitName("Apt " + entry.getUnit().getUnitNumber())
                    .tenantName(tenantName)
                    .transactionType(entry.getTransactionType())
                    .amount(entry.getAmount())
                    .balance(runningBalance)
                    .referenceId(entry.getReferenceId())
                    .description(entry.getDescription())
                    .createdAt(entry.getCreatedAt())
                    .build();
        });
    }
}
