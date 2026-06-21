package com.tenantliving.onboarding.service.interfaces;

import com.tenantliving.onboarding.dto.PreferenceResponse;
import com.tenantliving.onboarding.dto.SavePreferenceRequest;

import java.util.UUID;

public interface OnboardingPreferenceService {
    PreferenceResponse savePreference(UUID userId, SavePreferenceRequest request);
    PreferenceResponse getPreference(UUID userId);
}
