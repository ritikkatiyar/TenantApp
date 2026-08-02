package com.livic.billing.validator;

import com.livic.billing.annotation.FeatureKey;
import com.livic.billing.dto.UserSubscriptionContext;
import com.livic.property.facade.PropertyFacade;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

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

        int currentPropertyCount = propertyFacade.getPropertiesByUserId(userId).size();
        log.info("[PROPERTY LIMIT CHECK] User: {}, Current: {}, Max Allowed: {}", userId, currentPropertyCount, maxProperties);
        return currentPropertyCount < maxProperties;
    }

    @Override
    public FeatureKey getSupportedFeature() {
        return FeatureKey.MAX_PROPERTIES;
    }
}
