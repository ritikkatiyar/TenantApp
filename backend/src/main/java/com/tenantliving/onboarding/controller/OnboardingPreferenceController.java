package com.tenantliving.onboarding.controller;

import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.common.response.ApiResponse;
import com.tenantliving.onboarding.dto.PreferenceResponse;
import com.tenantliving.onboarding.dto.SavePreferenceRequest;
import com.tenantliving.onboarding.service.interfaces.OnboardingPreferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/api/v1/onboarding/preference")
@RequiredArgsConstructor
public class OnboardingPreferenceController {

    private final OnboardingPreferenceService service;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PreferenceResponse> savePreference(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody SavePreferenceRequest request
    ) {
        UUID userId = UUID.fromString(userDetails.getId());
        PreferenceResponse response = service.savePreference(userId, request);
        return ApiResponse.success(response);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<PreferenceResponse> getPreference(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getId());
        PreferenceResponse response = service.getPreference(userId);
        return ApiResponse.success(response);
    }
}
