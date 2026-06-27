package com.tenantliving.user.service.interfaces;

import com.tenantliving.user.dto.UserPreferenceResponse;
import com.tenantliving.user.dto.SaveUserPreferenceRequest;

import java.util.UUID;

public interface UserPreferenceService {
    UserPreferenceResponse savePreference(UUID userId, SaveUserPreferenceRequest request);
    UserPreferenceResponse getPreference(UUID userId);
}
