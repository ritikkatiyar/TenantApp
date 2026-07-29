package com.livic.finance.service.interfaces;

import java.util.UUID;

public interface PaymentStatementService {
    String generateStatementHtml(UUID rentCycleId, String token, String authHeader);
}
