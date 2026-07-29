package com.livic.user.service.impl;

import com.livic.user.domain.UserPreferenceTbl;
import com.livic.user.dto.UserPreferenceResponse;
import com.livic.user.dto.SaveUserPreferenceRequest;
import com.livic.user.repository.UserPreferenceRepository;
import com.livic.user.service.interfaces.UserPreferenceService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserPreferenceServiceImpl implements UserPreferenceService {

    private final UserPreferenceRepository repository;

    @Override
    @Transactional
    public UserPreferenceResponse savePreference(UUID userId, SaveUserPreferenceRequest request) {
        Optional<UserPreferenceTbl> existingOpt = repository.findByUserId(userId);

        UserPreferenceTbl preference;
        if (existingOpt.isPresent()) {
            preference = existingOpt.get();
            preference.setActiveMode(request.activeMode());
            preference.setOnboardingDone(true);
        } else {
            preference = UserPreferenceTbl.builder()
                    .userId(userId)
                    .activeMode(request.activeMode())
                    .onboardingDone(true)
                    .build();
        }

        preference = repository.save(preference);
        log.info("preference_saved userId={} activeMode={}", userId, request.activeMode());

        return new UserPreferenceResponse(
                preference.getId(),
                preference.getActiveMode(),
                preference.isOnboardingDone()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public UserPreferenceResponse getPreference(UUID userId) {
        return repository.findByUserId(userId)
                .map(pref -> new UserPreferenceResponse(
                        pref.getId(),
                        pref.getActiveMode(),
                        pref.isOnboardingDone()
                ))
                .orElseGet(() -> new UserPreferenceResponse(null, null, false));
    }
}
