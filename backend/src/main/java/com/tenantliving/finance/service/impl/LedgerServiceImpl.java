package com.tenantliving.finance.service.impl;

import com.tenantliving.finance.domain.FinanceLedgerTbl;
import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.dto.LedgerDTOs.LedgerEntryResponse;
import com.tenantliving.finance.repository.FinanceLedgerRepository;
import com.tenantliving.finance.specification.FinanceLedgerSpecifications;
import com.tenantliving.finance.service.interfaces.LedgerService;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LedgerServiceImpl implements LedgerService {

    private final FinanceLedgerRepository ledgerRepository;
    private final UserQueryService userQueryService;

    @Override
    @Transactional(readOnly = true)
    public Page<LedgerEntryResponse> getLedgerForProperty(UUID propertyId, LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable) {
        Specification<FinanceLedgerTbl> spec = Specification
                .where(FinanceLedgerSpecifications.hasPropertyId(propertyId))
                .and(FinanceLedgerSpecifications.createdAfter(fromDate))
                .and(FinanceLedgerSpecifications.createdBefore(toDate));

        Page<FinanceLedgerTbl> entriesPage = ledgerRepository.findAll(spec, pageable);

        // Batch fetch tenant users to avoid N+1 query
        Set<UUID> userIds = entriesPage.getContent().stream()
                .map(FinanceLedgerTbl::getLease)
                .filter(Objects::nonNull)
                .map(LeaseTbl::getUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<UUID, UserTbl> usersMap = userQueryService.getUsersByIds(userIds);

        return entriesPage.map(entry -> {
            String tenantName = "N/A";
            LeaseTbl lease = entry.getLease();
            if (lease != null && lease.getUserId() != null) {
                UserTbl tenant = usersMap.get(lease.getUserId());
                if (tenant != null) {
                    tenantName = tenant.getFullName();
                } else {
                    log.warn("Tenant user not found for lease userId: {}", lease.getUserId());
                }
            }

            // Compute running cumulative balance for this lease at this entry
            BigDecimal runningBalance = entry.getAmount();
            if (lease != null) {
                runningBalance = ledgerRepository.getRunningBalanceForLeaseAtEntry(
                        lease.getId(), entry.getCreatedAt(), entry.getId());
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
