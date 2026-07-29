package com.livic.billing.aspect;

import com.livic.billing.annotation.EnforceSubscription;
import com.livic.billing.annotation.SubscriptionFeature;
import com.livic.billing.domain.SaasSubscriptionTbl;
import com.livic.billing.service.interfaces.BillingWalletService;
import com.livic.billing.validator.SubscriptionValidator;
import com.livic.billing.validator.SubscriptionValidatorRegistry;
import com.livic.common.exception.BusinessException;
import com.livic.auth.principal.UserDetailsImpl;
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

    private final BillingWalletService billingWalletService;
    private final SubscriptionValidatorRegistry validatorRegistry;

    @Before("@annotation(enforceSubscription)")
    public void enforce(JoinPoint joinPoint, EnforceSubscription enforceSubscription) {
        SubscriptionFeature feature = enforceSubscription.feature();
        UUID ownerId = resolveOwnerId();

        if (ownerId == null) {
            log.warn("[SUBSCRIPTION ENFORCEMENT] Could not resolve owner ID for feature check: {}", feature);
            return; // Skip validation if user info not resolvable
        }

        SaasSubscriptionTbl subscription = billingWalletService.getActiveSubscription(ownerId);
        SubscriptionValidator validator = validatorRegistry.getValidator(feature);

        if (validator != null) {
            boolean allowed = validator.validate(ownerId, subscription.getPlanName());
            log.info("[SUBSCRIPTION ASPECT] User: {}, Feature: {}, Plan: {}, Allowed: {}",
                    ownerId, feature, subscription.getPlanName(), allowed);

            if (!allowed) {
                throw new BusinessException(
                        HttpStatus.FORBIDDEN,
                        String.format("Property limit exceeded. Your '%s' plan has hit its maximum allowed resources for %s. Upgrade your plan to add more.",
                                subscription.getPlanName(), feature.name().toLowerCase())
                );
            }
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
