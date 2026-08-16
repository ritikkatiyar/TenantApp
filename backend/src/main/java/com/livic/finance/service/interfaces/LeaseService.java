package com.livic.finance.service.interfaces;

import com.livic.finance.domain.LeaseTbl;
import com.livic.finance.dto.LeaseDTOs;
import java.util.UUID;

public interface LeaseService {
    LeaseTbl createLease(LeaseDTOs.CreateLeaseRequest request, UUID assignedByUserId);
    LeaseDTOs.LeaseResponse terminateLease(UUID id);
    LeaseTbl updateNoticePeriod(UUID id, java.time.LocalDate moveOutDate);
    LeaseTbl updateLeaseTerms(UUID id, java.math.BigDecimal monthlyRentAmount, java.math.BigDecimal securityDeposit);
}
