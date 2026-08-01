package com.livic.billing.validator;

import com.livic.billing.annotation.FeatureKey;
import com.livic.billing.dto.UserSubscriptionContext;
import com.livic.property.domain.PropertyTbl;
import com.livic.property.service.interfaces.PropertyQueryService;
import com.livic.property.service.interfaces.UnitQueryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class UnitLimitValidator implements SubscriptionValidator {

    private final PropertyQueryService propertyQueryService;
    private final UnitQueryService unitQueryService;

    @Override
    public boolean validate(UUID userId, UserSubscriptionContext context) {
        int maxUnits = context.getLimit(FeatureKey.MAX_UNITS);
        if (maxUnits == -1) {
            return true; // Unlimited
        }

        List<PropertyTbl> properties = propertyQueryService.getPropertiesByUserId(userId);
        int currentUnitCount = 0;
        for (PropertyTbl prop : properties) {
            currentUnitCount += unitQueryService.getUnitsByProperty(prop.getId()).size();
        }

        log.info("[UNIT LIMIT CHECK] User: {}, Current Units: {}, Max Allowed: {}", userId, currentUnitCount, maxUnits);
        return currentUnitCount < maxUnits;
    }

    @Override
    public FeatureKey getSupportedFeature() {
        return FeatureKey.MAX_UNITS;
    }
}
