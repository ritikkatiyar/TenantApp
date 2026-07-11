package com.tenantliving.finance.service.impl;

import com.tenantliving.finance.domain.FinanceLedgerTbl;
import com.tenantliving.finance.domain.LeaseTbl;
import com.tenantliving.finance.dto.LedgerDTOs.LedgerEntryResponse;
import com.tenantliving.finance.repository.FinanceLedgerRepository;
import com.tenantliving.finance.service.interfaces.LedgerService;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LedgerServiceImpl implements LedgerService {

    private final FinanceLedgerRepository ledgerRepository;
    private final UserQueryService userQueryService;

    @Override
    @Transactional(readOnly = true)
    public List<LedgerEntryResponse> getLedgerForProperty(UUID propertyId) {
        List<FinanceLedgerTbl> entries = ledgerRepository.findAllByUnit_Property_IdOrderByCreatedAtDesc(propertyId);
        List<LedgerEntryResponse> responses = new ArrayList<>();

        for (FinanceLedgerTbl entry : entries) {
            String tenantName = "N/A";
            LeaseTbl lease = entry.getLease();
            if (lease != null && lease.getUserId() != null) {
                try {
                    UserTbl tenant = userQueryService.getUserById(lease.getUserId());
                    tenantName = tenant.getFullName();
                } catch (Exception e) {
                    // Ignore
                }
            }

            responses.add(LedgerEntryResponse.builder()
                    .id(entry.getId())
                    .unitName("Apt " + entry.getUnit().getUnitNumber())
                    .tenantName(tenantName)
                    .transactionType(entry.getTransactionType())
                    .amount(entry.getAmount())
                    .balance(entry.getBalance())
                    .referenceId(entry.getReferenceId())
                    .description(entry.getDescription())
                    .createdAt(entry.getCreatedAt())
                    .build());
        }

        return responses;
    }
}
