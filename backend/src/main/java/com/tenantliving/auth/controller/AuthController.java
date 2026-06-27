package com.tenantliving.auth.controller;

import com.tenantliving.auth.dto.AuthRequests.LoginRequest;
import com.tenantliving.auth.dto.AuthRequests.LogoutRequest;
import com.tenantliving.auth.dto.AuthRequests.RefreshRequest;
import com.tenantliving.auth.dto.AuthRequests.SignupRequest;
import com.tenantliving.auth.dto.AuthResponses.TokenBundle;
import com.tenantliving.auth.service.interfaces.AuthService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.tenantliving.common.response.ApiResponse;

/**
 * HTTP API for JWT authentication (signup, login, refresh, validate, current user).
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
    /**
     * Authentication
     * JWT signup, login, refresh, token validation, and sessionless API access
     */

public class AuthController {

    private final AuthService authService;

    @PostMapping("/signup")
        /**
     * Register a new tenant account
     * Creates a USER with normalized email in `auth_uid`. Returns access and refresh tokens.
     */

    
    public ResponseEntity<ApiResponse<TokenBundle>> signup(@Valid @RequestBody SignupRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.signup(request)));
    }

    @PostMapping("/login")
        /**
     * Login with email and password
     * Returns access and refresh tokens. Accounts without a stored password cannot use this endpoint.
     */

    
    public ResponseEntity<ApiResponse<TokenBundle>> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.login(request)));
    }

    @PostMapping("/refresh")
        /**
     * Refresh tokens
     * old refresh row is removed, new pair returned.
     */
    
    public ResponseEntity<ApiResponse<TokenBundle>> refresh(@Valid @RequestBody RefreshRequest request) {
        return ResponseEntity.ok(ApiResponse.success(authService.refresh(request)));
    }

    @PostMapping("/logout")
        /**
     * Logout current session
     * Revokes the provided refresh token. The access token naturally expires.
     */

    
    public ResponseEntity<ApiResponse<Void>> logout(@Valid @RequestBody LogoutRequest request) {
        authService.logout(request);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

}
