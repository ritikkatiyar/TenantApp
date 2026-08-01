package com.livic.billing.aspect;

import com.livic.auth.principal.UserDetailsImpl;
import com.livic.billing.annotation.EnforceSubscription;
import com.livic.billing.annotation.FeatureKey;
import com.livic.billing.dto.UserSubscriptionContext;
import com.livic.billing.service.interfaces.SubscriptionCacheService;
import com.livic.billing.validator.SubscriptionValidator;
import com.livic.billing.validator.SubscriptionValidatorRegistry;
import com.livic.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class SubscriptionEnforcementAspect {

    private final SubscriptionCacheService subscriptionCacheService;
    private final SubscriptionValidatorRegistry validatorRegistry;

    @Before("@annotation(enforceSubscription)")
    public void enforce(JoinPoint joinPoint, EnforceSubscription enforceSubscription) {
        FeatureKey feature = enforceSubscription.feature();
        UUID ownerId = resolveOwnerId();

        if (ownerId == null) {
            log.warn("[SUBSCRIPTION ENFORCEMENT] Could not resolve owner ID for feature check: {}", feature);
            return; // Skip validation if authentication info not resolvable
        }

        // Sub-millisecond lookup from in-memory cache
        UserSubscriptionContext context = subscriptionCacheService.getUserSubscriptionContext(ownerId);
        SubscriptionValidator validator = validatorRegistry.getValidator(feature);

        boolean allowed;
        if (validator != null) {
            allowed = validator.validate(ownerId, context);
        } else {
            // Default check for boolean feature toggles
            allowed = context.isFeatureEnabled(feature);
        }

        log.info("[SUBSCRIPTION ASPECT] User: {}, Feature: {}, Plan: {}, Allowed: {}",
                ownerId, feature, context.getPlanKey(), allowed);

        if (!allowed) {
            throw new BusinessException(
                    HttpStatus.FORBIDDEN,
                    String.format("Feature '%s' limit reached or not included in your '%s' plan. Please upgrade your subscription plan to access this capability.",
                            feature.name(), context.getPlanKey())
            );
        }
    }

    private UUID resolveOwnerId() {
        try {
            Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
            if (principal instanceof UserDetailsImpl) {
                return UUID.fromString(((UserDetailsImpl) principal).getId());
            }
        } catch (Exception e) {
            log.debug("Authentication not available in SecurityContextHolder");
        }
        return null;
    }
}
