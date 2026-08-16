package com.livic.finance.service.interfaces;

import java.util.UUID;

public interface FinanceAuthorizationService {
    boolean hasPermissionByChargeConfigId(UUID chargeConfigId, String permissionCode);
}
