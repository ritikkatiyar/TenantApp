package com.livic.auth.service.impl;

import com.livic.auth.domain.RefreshTokenTbl;
import com.livic.auth.dto.AuthRequests.LoginRequest;
import com.livic.auth.dto.AuthRequests.LogoutRequest;
import com.livic.auth.dto.AuthRequests.RefreshRequest;
import com.livic.auth.dto.AuthRequests.SignupRequest;
import com.livic.auth.dto.AuthRequests.ValidateRequest;
import com.livic.auth.dto.AuthResponses.AuthUserSummary;
import com.livic.auth.dto.AuthResponses.TokenBundle;
import com.livic.auth.dto.AuthResponses.ValidateResponse;
import com.livic.auth.service.JwtService;
import com.livic.auth.service.TokenHasher;
import com.livic.auth.service.interfaces.AuthService;
import com.livic.auth.service.interfaces.RefreshTokenCrudService;
import com.livic.common.exception.BusinessException;
import com.livic.config.AuthProperties;
import com.livic.config.JwtProperties;
import com.livic.user.domain.UserTbl;
import com.livic.user.dto.UserSummaryDTO;
import com.livic.user.facade.UserFacade;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

/**
 * Application use-cases for registration, credential login, token refresh, and JWT validation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserFacade userFacade;
    private final RefreshTokenCrudService refreshTokenCrudService;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final AuthProperties authProperties;

    @Transactional
    public TokenBundle signup(SignupRequest request) {
        String email = normalizeEmail(request.email());
        if (userFacade.existsByEmail(email)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Email already registered");
        }

        String phone = normalizePhone(request.phoneNumber());
        UserSummaryDTO userSummary = userFacade.createUser(email, request.fullName(), phone, request.password());
        UserTbl user = new UserTbl();
        user.setId(userSummary.id());
        user.setAuthUid(userSummary.authUid());
        user.setFullName(userSummary.fullName());
        user.setPhoneNumber(userSummary.phoneNumber());
        user.setGlobalRole(com.livic.common.domain.UserRole.USER);
        return issueTokensForUser(user);
    }

    @Transactional
    public TokenBundle login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        UserSummaryDTO userSummary = userFacade.getUserByEmail(email)
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.password())
            );
        } catch (AuthenticationException e) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        UserTbl loginUser = new UserTbl();
        loginUser.setId(userSummary.id());
        loginUser.setAuthUid(userSummary.authUid());
        loginUser.setFullName(userSummary.fullName());
        loginUser.setPhoneNumber(userSummary.phoneNumber());
        loginUser.setGlobalRole(com.livic.common.domain.UserRole.USER);

        return issueTokensForUser(loginUser);
    }

    @Transactional
    public TokenBundle refresh(RefreshRequest request) {
        String hash = TokenHasher.sha256Hex(request.refreshToken());
        RefreshTokenTbl stored = refreshTokenCrudService.findByTokenHashAndRevokedIsFalse(hash)
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Refresh token expired");
        }

        java.util.UUID userId = stored.getUserId();
        UserSummaryDTO userSummary = userFacade.getUserById(userId)
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "User not found"));
        UserTbl user = new UserTbl();
        user.setId(userSummary.id());
        user.setAuthUid(userSummary.authUid());
        user.setFullName(userSummary.fullName());
        user.setPhoneNumber(userSummary.phoneNumber());
        user.setGlobalRole(com.livic.common.domain.UserRole.USER);

        refreshTokenCrudService.delete(stored);
        return issueTokensForUser(user);
    }

    @Transactional
    public void logout(LogoutRequest request) {
        String hash = TokenHasher.sha256Hex(request.refreshToken());
        refreshTokenCrudService.findByTokenHashAndRevokedIsFalse(hash)
                .ifPresent(refreshTokenCrudService::delete);
    }

    public ValidateResponse validate(ValidateRequest request) {
        try {
            Claims claims = jwtService.parseAndValidate(request.accessToken());
            Long exp = claims.getExpiration() != null
                    ? claims.getExpiration().toInstant().getEpochSecond()
                    : null;
            return new ValidateResponse(
                    true,
                    claims.getSubject(),
                    claims.get("email", String.class),
                    exp,
                    null
            );
        } catch (ExpiredJwtException e) {
            return new ValidateResponse(false, null, null, null, "Token expired");
        } catch (JwtException e) {
            return new ValidateResponse(false, null, null, null, "Invalid token");
        }
    }

    private TokenBundle issueTokensForUser(UserTbl user) {
        String access = jwtService.createAccessToken(user);
        String refreshPlain = createAndPersistRefreshToken(user);
        long expSec = Math.max(1L, jwtProperties.accessExpirationMs() / 1000L);
        return new TokenBundle(
                access,
                refreshPlain,
                "Bearer",
                expSec,
                toSummary(user)
        );
    }

    private String createAndPersistRefreshToken(UserTbl user) {
        byte[] raw = new byte[32];
        RANDOM.nextBytes(raw);
        String plain = Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        String hash = TokenHasher.sha256Hex(plain);
        Instant exp = Instant.now().plusMillis(jwtProperties.refreshExpirationMs());
        RefreshTokenTbl entity = RefreshTokenTbl.builder()
                .userId(user.getId())
                .tokenHash(hash)
                .expiresAt(exp)
                .revoked(false)
                .build();
        refreshTokenCrudService.save(entity);
        return plain;
    }

    private static AuthUserSummary toSummary(UserTbl user) {
        return new AuthUserSummary(
                user.getId().toString(),
                user.getAuthUid(),
                user.getFullName()
        );
    }

    private static String normalizeEmail(String email) {
        return email.trim().toLowerCase();
    }

    private static String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return null;
        }
        return phone.trim();
    }
}
