package com.tenantliving.onboarding.service.impl;

import com.tenantliving.onboarding.domain.OnboardingPreferenceTbl;
import com.tenantliving.onboarding.dto.PreferenceResponse;
import com.tenantliving.onboarding.dto.SavePreferenceRequest;
import com.tenantliving.onboarding.repository.OnboardingPreferenceRepository;
import com.tenantliving.onboarding.service.interfaces.OnboardingPreferenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class OnboardingPreferenceServiceImpl implements OnboardingPreferenceService {

    private final OnboardingPreferenceRepository repository;

    @Override
    @Transactional
    public PreferenceResponse savePreference(UUID userId, SavePreferenceRequest request) {
        Optional<OnboardingPreferenceTbl> existingOpt = repository.findByUserId(userId);

        OnboardingPreferenceTbl preference;
        if (existingOpt.isPresent()) {
            preference = existingOpt.get();
            preference.setActiveMode(request.activeMode());
            preference.setOnboardingDone(true);
        } else {
            preference = OnboardingPreferenceTbl.builder()
                    .userId(userId)
                    .activeMode(request.activeMode())
                    .onboardingDone(true)
                    .build();
        }

        preference = repository.save(preference);
        log.info("preference_saved userId={} activeMode={}", userId, request.activeMode());

        return new PreferenceResponse(
                preference.getId(),
                preference.getActiveMode(),
                preference.isOnboardingDone()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public PreferenceResponse getPreference(UUID userId) {
        return repository.findByUserId(userId)
                .map(pref -> new PreferenceResponse(
                        pref.getId(),
                        pref.getActiveMode(),
                        pref.isOnboardingDone()
                ))
                .orElseGet(() -> new PreferenceResponse(null, null, false));
    }
}
