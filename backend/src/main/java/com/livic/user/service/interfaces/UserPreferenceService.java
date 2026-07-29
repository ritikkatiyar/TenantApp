package com.livic.user.service.interfaces;

import com.livic.user.dto.UserPreferenceResponse;
import com.livic.user.dto.SaveUserPreferenceRequest;

import java.util.UUID;

public interface UserPreferenceService {
    UserPreferenceResponse savePreference(UUID userId, SaveUserPreferenceRequest request);
    UserPreferenceResponse getPreference(UUID userId);
}
