package com.livic.billing.validator;

import com.livic.auth.service.interfaces.MembershipQueryService;
import com.livic.billing.annotation.FeatureKey;
import com.livic.billing.dto.UserSubscriptionContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class TeamMemberLimitValidator implements SubscriptionValidator {

    private final MembershipQueryService membershipQueryService;

    @Override
    public boolean validate(UUID userId, UserSubscriptionContext context) {
        int maxMembers = context.getLimit(FeatureKey.MAX_TEAM_MEMBERS);
        if (maxMembers == -1) {
            return true; // Unlimited
        }

        int currentMembers = membershipQueryService.getMembershipsByUserId(userId).size();
        log.info("[TEAM MEMBER LIMIT CHECK] User: {}, Current Members: {}, Max Allowed: {}", userId, currentMembers, maxMembers);
        return currentMembers < maxMembers;
    }

    @Override
    public FeatureKey getSupportedFeature() {
        return FeatureKey.MAX_TEAM_MEMBERS;
    }
}
