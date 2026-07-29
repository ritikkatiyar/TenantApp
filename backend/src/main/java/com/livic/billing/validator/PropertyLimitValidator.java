package com.livic.billing.validator;

import com.livic.billing.annotation.SubscriptionFeature;
import com.livic.property.service.interfaces.PropertyQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class PropertyLimitValidator implements SubscriptionValidator {

    private final PropertyQueryService propertyQueryService;

    private static final int STARTER_PLAN_LIMIT = 1;      // Free plan: 1 property
    private static final int BASIC_PLAN_LIMIT = 3;        // Basic: 3 properties
    private static final int PREMIUM_PLAN_LIMIT = 10;     // Premium: 10 properties
    private static final int ENTERPRISE_PLAN_LIMIT = Integer.MAX_VALUE;

    @Override
    public boolean validate(UUID userId, String planName) {
        int maxProperties = getPropertyLimitByPlan(planName);
        int currentPropertyCount = propertyQueryService.getPropertiesByUserId(userId).size();
        return currentPropertyCount < maxProperties;
    }

    @Override
    public SubscriptionFeature getSupportedFeature() {
        return SubscriptionFeature.PROPERTIES;
    }

    private int getPropertyLimitByPlan(String planName) {
        if (planName == null) return STARTER_PLAN_LIMIT;
        return switch (planName.toUpperCase()) {
            case "STARTER", "FREE" -> STARTER_PLAN_LIMIT;
            case "BASIC" -> BASIC_PLAN_LIMIT;
            case "PREMIUM" -> PREMIUM_PLAN_LIMIT;
            case "ENTERPRISE" -> ENTERPRISE_PLAN_LIMIT;
            default -> STARTER_PLAN_LIMIT;
        };
    }
}
