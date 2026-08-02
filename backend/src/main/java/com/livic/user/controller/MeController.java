package com.livic.user.controller;

import com.livic.auth.principal.UserDetailsImpl;
import com.livic.common.response.ApiResponse;
import com.livic.user.dto.MeDTOs;
import com.livic.user.dto.UserDTOs;
import com.livic.user.service.interfaces.MeService;
import com.livic.user.service.interfaces.UserQueryService;
import com.livic.user.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class MeController {

    private final MeService meService;
    private final UserQueryService userQueryService;
    private final UserService userService;

    @GetMapping("/me/context")
    public ResponseEntity<ApiResponse<MeDTOs.MyContextResponse>> getContext(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(meService.getUserContext(userId)));
    }

    @GetMapping("/tenant/profile")
    public ResponseEntity<ApiResponse<UserDTOs.TenantProfileResponse>> getTenantProfile(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(
                UserDTOs.TenantProfileResponse.from(userQueryService.getUserById(userId))
        ));
    }

    @PutMapping("/tenant/profile")
    public ResponseEntity<ApiResponse<UserDTOs.TenantProfileResponse>> updateTenantProfile(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody UserDTOs.UpdateTenantProfileRequest request
    ) {
        UUID userId = UUID.fromString(currentUser.getId());
        return ResponseEntity.ok(ApiResponse.success(
                userService.updateTenantProfile(userQueryService.getUserById(userId), request)
        ));
    }
}
