package com.livic.user.controller;

import com.livic.common.response.ApiResponse;
import com.livic.auth.principal.UserDetailsImpl;
import com.livic.user.dto.UserPreferenceResponse;
import com.livic.user.dto.SaveUserPreferenceRequest;
import com.livic.user.service.interfaces.UserPreferenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/user/preference")
@RequiredArgsConstructor
public class UserPreferenceController {

    private final UserPreferenceService service;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<UserPreferenceResponse> savePreference(
            @AuthenticationPrincipal UserDetailsImpl userDetails,
            @Valid @RequestBody SaveUserPreferenceRequest request
    ) {
        UUID userId = UUID.fromString(userDetails.getId());
        UserPreferenceResponse response = service.savePreference(userId, request);
        return ApiResponse.success(response);
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<UserPreferenceResponse> getPreference(
            @AuthenticationPrincipal UserDetailsImpl userDetails
    ) {
        UUID userId = UUID.fromString(userDetails.getId());
        UserPreferenceResponse response = service.getPreference(userId);
        return ApiResponse.success(response);
    }
}
