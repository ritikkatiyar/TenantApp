package com.livic.finance.service.impl;

import com.livic.auth.service.interfaces.AuthorizationService;
import com.livic.finance.service.interfaces.ChargeConfigCrudService;
import com.livic.finance.service.interfaces.FinanceAuthorizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Slf4j
@Component("financeAuthorizationService")
@RequiredArgsConstructor
public class FinanceAuthorizationServiceImpl implements FinanceAuthorizationService {

    private final ChargeConfigCrudService chargeConfigCrudService;
    private final AuthorizationService authorizationService;

    @Override
    @Transactional(readOnly = true)
    public boolean hasPermissionByChargeConfigId(UUID chargeConfigId, String permissionCode) {
        if (chargeConfigId == null) return false;
        try {
            return chargeConfigCrudService.findById(chargeConfigId)
                    .map(c -> authorizationService.hasPermission(c.getPropertyId(), permissionCode))
                    .orElse(false);
        } catch (Exception e) {
            log.error("Error checking permission for chargeConfigId {}: {}", chargeConfigId, e.getMessage(), e);
            return false;
        }
    }
}
