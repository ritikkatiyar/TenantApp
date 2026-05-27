package com.tenantliving.billing.validator;

import com.tenantliving.billing.annotation.SubscriptionFeature;
import java.util.UUID;

public interface SubscriptionValidator {
    boolean validate(UUID userId, String planName);
    SubscriptionFeature getSupportedFeature();
}
