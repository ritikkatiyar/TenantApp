package com.livic.user.dto;

import com.livic.user.domain.UserMode;

import java.util.UUID;

public record UserPreferenceResponse(
        UUID id,
        UserMode activeMode,
        boolean onboardingDone
) {
}
