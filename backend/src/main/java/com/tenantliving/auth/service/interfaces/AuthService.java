package com.tenantliving.auth.service.interfaces;

import com.tenantliving.auth.dto.AuthRequests.LoginRequest;
import com.tenantliving.auth.dto.AuthRequests.LogoutRequest;
import com.tenantliving.auth.dto.AuthRequests.RefreshRequest;
import com.tenantliving.auth.dto.AuthRequests.SignupRequest;
import com.tenantliving.auth.dto.AuthRequests.ValidateRequest;
import com.tenantliving.auth.dto.AuthResponses.TokenBundle;
import com.tenantliving.auth.dto.AuthResponses.ValidateResponse;

public interface AuthService {
    TokenBundle signup(SignupRequest request);
    TokenBundle login(LoginRequest request);
    TokenBundle refresh(RefreshRequest request);
    void logout(LogoutRequest request);
    ValidateResponse validate(ValidateRequest request);
}
