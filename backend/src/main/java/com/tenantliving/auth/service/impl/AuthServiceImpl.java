package com.tenantliving.auth.service.impl;

import com.tenantliving.auth.dto.AuthRequests.LoginRequest;
import com.tenantliving.auth.dto.AuthRequests.RefreshRequest;
import com.tenantliving.auth.dto.AuthRequests.SignupRequest;
import com.tenantliving.auth.dto.AuthRequests.ValidateRequest;
import com.tenantliving.auth.dto.AuthResponses.AuthUserSummary;
import com.tenantliving.auth.dto.AuthResponses.TokenBundle;
import com.tenantliving.auth.dto.AuthResponses.ValidateResponse;
import com.tenantliving.auth.domain.RefreshTokenTbl;
import com.tenantliving.auth.repository.RefreshTokenRepository;
import com.tenantliving.common.exception.BusinessException;
import com.tenantliving.config.AuthProperties;
import com.tenantliving.config.JwtProperties;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserService;
import com.tenantliving.auth.service.interfaces.AuthService;
import com.tenantliving.auth.service.JwtService;
import com.tenantliving.auth.service.TokenHasher;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;

/**
 * Application use-cases for registration, credential login, token refresh, and JWT validation.
 */
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserService userService;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final JwtProperties jwtProperties;
    private final AuthProperties authProperties;

    @Transactional
    public TokenBundle signup(SignupRequest request) {
        String email = normalizeEmail(request.email());
        if (userService.existsByEmail(email)) {
            throw new BusinessException(HttpStatus.CONFLICT, "Email already registered");
        }

        String phone = normalizePhone(request.phoneNumber());

        UserTbl user = UserTbl.builder()
                .authUid(email)
                .fullName(request.fullName().trim())
                .phoneNumber(phone)
                .passwordHash(passwordEncoder.encode(request.password()))
                .build();
        userService.createUser(user);
        return issueTokensForUser(user);
    }

    @Transactional
    public TokenBundle login(LoginRequest request) {
        String email = normalizeEmail(request.email());
        Optional<UserTbl> optionalUser = userService.findByEmail(email);
        optionalUser.ifPresent(this::clearExpiredLock);

        if (optionalUser.isPresent() && isLocked(optionalUser.get())) {
            throw new BusinessException(HttpStatus.LOCKED,
                    "Account temporarily locked due to repeated login attempts. Try again later.");
        }

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.password())
            );
        } catch (LockedException e) {
            throw new BusinessException(HttpStatus.LOCKED,
                    "Account temporarily locked due to repeated login attempts. Try again later.");
        } catch (BadCredentialsException e) {
            optionalUser.ifPresent(this::recordFailedLogin);
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        } catch (AuthenticationException e) {
            optionalUser.ifPresent(this::recordFailedLogin);
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        UserTbl user = optionalUser.orElseThrow(
                () -> new BusinessException(HttpStatus.UNAUTHORIZED, "Invalid email or password")
        );

        if (user.getPasswordHash() == null || user.getPasswordHash().isEmpty()) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Password login is not enabled for this account");
        }

        resetFailedLogin(user);
        return issueTokensForUser(user);
    }

    private boolean isLocked(UserTbl user) {
        return user.getLockoutUntil() != null && user.getLockoutUntil().isAfter(Instant.now());
    }

    private void clearExpiredLock(UserTbl user) {
        if (user.getLockoutUntil() != null && !user.getLockoutUntil().isAfter(Instant.now())) {
            user.setFailedLoginAttempts(0);
            user.setLockoutUntil(null);
            userService.saveUser(user);
        }
    }

    private void resetFailedLogin(UserTbl user) {
        if (user.getFailedLoginAttempts() != 0 || user.getLockoutUntil() != null) {
            user.setFailedLoginAttempts(0);
            user.setLockoutUntil(null);
            userService.saveUser(user);
        }
    }

    private void recordFailedLogin(UserTbl user) {
        int attempts = user.getFailedLoginAttempts() + 1;
        if (attempts >= authProperties.maxFailedLoginAttempts()) {
            user.setFailedLoginAttempts(0);
            user.setLockoutUntil(Instant.now().plusMillis(authProperties.lockoutDurationMs()));
        } else {
            user.setFailedLoginAttempts(attempts);
        }
        userService.saveUser(user);
    }

    @Transactional
    public TokenBundle refresh(RefreshRequest request) {
        String hash = TokenHasher.sha256Hex(request.refreshToken());
        RefreshTokenTbl stored = refreshTokenRepository.findByTokenHashAndRevokedIsFalse(hash)
                .orElseThrow(() -> new BusinessException(HttpStatus.UNAUTHORIZED, "Invalid refresh token"));

        if (stored.getExpiresAt().isBefore(Instant.now())) {
            throw new BusinessException(HttpStatus.UNAUTHORIZED, "Refresh token expired");
        }

        UserTbl user = stored.getUser();
        refreshTokenRepository.delete(stored);
        return issueTokensForUser(user);
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
                .user(user)
                .tokenHash(hash)
                .expiresAt(exp)
                .revoked(false)
                .build();
        refreshTokenRepository.save(entity);
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
