package com.livic.user.controller;

import com.livic.common.response.ApiResponse;
import com.livic.user.domain.UserTbl;
import com.livic.user.dto.UserDTOs;
import com.livic.user.dto.MeDTOs;
import com.livic.user.service.interfaces.UserService;
import com.livic.user.service.interfaces.UserQueryService;
import com.livic.user.service.interfaces.MeService;
import com.livic.auth.principal.UserDetailsImpl;
import org.springframework.security.crypto.password.PasswordEncoder;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import jakarta.validation.Valid;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    private final UserQueryService userQueryService;
    private final MeService meService;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/search")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<UserDTOs.UserSearchResponse>>> searchByPhone(
            @RequestParam String phone
    ) {
        List<UserDTOs.UserSearchResponse> results = userQueryService.searchByPhoneNumber(phone).stream()
                .map(UserDTOs.UserSearchResponse::from)
                .toList();
        return ResponseEntity.ok(ApiResponse.success(results));
    }

    @PostMapping("/create-tenant")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserDTOs.UserSearchResponse>> createTenant(
            @Valid @RequestBody UserDTOs.CreateTenantRequest request
    ) {
        String email = request.email().trim().toLowerCase();
        if (userQueryService.existsByEmail(email)) {
            throw new com.livic.common.exception.BusinessException(
                    org.springframework.http.HttpStatus.CONFLICT, "Email already registered"
            );
        }

        String phone = request.phoneNumber().trim();
        if (userQueryService.findByPhoneNumber(phone).isPresent()) {
            throw new com.livic.common.exception.BusinessException(
                    org.springframework.http.HttpStatus.CONFLICT, "Phone number already registered"
            );
        }

        UserTbl user = UserTbl.builder()
                .authUid(email)
                .fullName(request.fullName().trim())
                .phoneNumber(phone)
                .passwordHash(passwordEncoder.encode(phone))
                .globalRole(com.livic.common.domain.UserRole.USER)
                .build();

        UserTbl savedUser = userService.createUser(user);

        return ResponseEntity.ok(ApiResponse.success(UserDTOs.UserSearchResponse.from(savedUser)));
    }

    @GetMapping("/me/context")
    public ResponseEntity<ApiResponse<MeDTOs.MyContextResponse>> getContext(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }

        UUID userId = UUID.fromString(currentUser.getId());
        MeDTOs.MyContextResponse context = meService.getUserContext(userId);

        return ResponseEntity.ok(ApiResponse.success(context));
    }

    @GetMapping("/tenant/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserDTOs.TenantProfileResponse>> getTenantProfile(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        UUID userId = UUID.fromString(currentUser.getId());
        UserTbl user = userQueryService.getUserById(userId);
        return ResponseEntity.ok(ApiResponse.success(UserDTOs.TenantProfileResponse.from(user)));
    }

    @org.springframework.web.bind.annotation.PutMapping("/tenant/profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserDTOs.TenantProfileResponse>> updateTenantProfile(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @RequestBody UserDTOs.UpdateTenantProfileRequest request
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        UUID userId = UUID.fromString(currentUser.getId());
        UserTbl user = userQueryService.getUserById(userId);
        if (request.phone() != null && !request.phone().isBlank()) {
            user.setPhoneNumber(request.phone());
            userService.createUser(user);
        }
        return ResponseEntity.ok(ApiResponse.success(UserDTOs.TenantProfileResponse.from(user)));
    }
}
