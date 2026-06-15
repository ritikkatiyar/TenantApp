package com.tenantliving.billing.validator;

import com.tenantliving.billing.annotation.SubscriptionFeature;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@Slf4j
public class AiCommandValidator implements SubscriptionValidator {

    @Override
    public boolean validate(UUID userId, String planName) {
        // For demo purposes we set simple limits:
        // FREE (STARTER) -> 0 AI commands allowed
        // BASIC -> up to 5 commands per day (not tracked here, just a static guard)
        // PREMIUM/ENTERPRISE -> unlimited (return true)
        SubscriptionFeature feature = SubscriptionFeature.AI_COMMANDS;
        int allowed = getAllowedCommands(planName);
        log.debug("[AI VALIDATOR] User {} on plan {} allowed commands: {}", userId, planName, allowed);
        // In a real implementation we would track usage count; here we just enforce static limit >0
        return allowed > 0;
    }

    @Override
    public SubscriptionFeature getSupportedFeature() {
        return SubscriptionFeature.AI_COMMANDS;
    }

    private int getAllowedCommands(String planName) {
        if (planName == null) return 0;
        return switch (planName.toUpperCase()) {
            case "STARTER", "FREE" -> 0; // No AI commands
            case "BASIC" -> 5; // Limited
            case "PREMIUM", "ENTERPRISE" -> Integer.MAX_VALUE; // Unlimited
            default -> 0;
        };
    }
}
