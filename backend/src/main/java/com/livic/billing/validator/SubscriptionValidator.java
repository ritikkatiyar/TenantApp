package com.livic.billing.validator;

import com.livic.billing.annotation.SubscriptionFeature;
import java.util.UUID;

public interface SubscriptionValidator {
    boolean validate(UUID userId, String planName);
    SubscriptionFeature getSupportedFeature();
}
