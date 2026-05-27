package com.tenantliving.billing.validator;

import com.tenantliving.billing.annotation.SubscriptionFeature;
import org.springframework.stereotype.Component;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class SubscriptionValidatorRegistry {

    private final Map<SubscriptionFeature, SubscriptionValidator> validators = new HashMap<>();

    public SubscriptionValidatorRegistry(List<SubscriptionValidator> validatorList) {
        for (SubscriptionValidator validator : validatorList) {
            validators.put(validator.getSupportedFeature(), validator);
        }
    }

    public SubscriptionValidator getValidator(SubscriptionFeature feature) {
        return validators.get(feature);
    }
}
