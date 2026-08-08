package com.livic.billing.validator;

import com.livic.billing.annotation.FeatureKey;
import com.livic.billing.dto.UserSubscriptionContext;
import com.livic.property.facade.PropertyFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

import org.springframework.data.domain.Pageable;

@Component
@RequiredArgsConstructor
@Slf4j
public class PropertyLimitValidator implements SubscriptionValidator {

    private final PropertyFacade propertyFacade;

    @Override
    public boolean validate(UUID userId, UserSubscriptionContext context) {
        int maxProperties = context.getLimit(FeatureKey.MAX_PROPERTIES);
        if (maxProperties == -1) {
            return true; // Unlimited
        }

        long currentPropertyCount = propertyFacade.getPropertiesByUserId(userId, Pageable.unpaged()).getTotalElements();
        
        log.atInfo()
                .setMessage("[PROPERTY LIMIT CHECK]")
                .addKeyValue("userId", userId)
                .addKeyValue("currentProperties", currentPropertyCount)
                .addKeyValue("maxAllowed", maxProperties)
                .addKeyValue("correlationId", org.slf4j.MDC.get("correlationId"))
                .addKeyValue("traceId", org.slf4j.MDC.get("traceId"))
                .addKeyValue("spanId", org.slf4j.MDC.get("spanId"))
                .log();

        return currentPropertyCount < maxProperties;
    }

    @Override
    public FeatureKey getSupportedFeature() {
        return FeatureKey.MAX_PROPERTIES;
    }
}
