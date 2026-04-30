package com.tenantliving.auth;

import com.tenantliving.user.User;
import com.tenantliving.user.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication controller for login and user info endpoints.
 * 
 * Note: In production, this would validate Firebase/Auth0 tokens.
 * For development, we use HTTP Basic Auth.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepo userRepository;

    /**
     * Get current authenticated user info.
     * Used to verify authentication and get user details.
     */
    @GetMapping("/me")
    public ResponseEntity<AuthResponse> getCurrentUser(
            @AuthenticationPrincipal UserDetailsImpl currentUser
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }

        AuthResponse response = new AuthResponse(
                currentUser.getId(),
                currentUser.getUsername(),
                currentUser.getFullName(),
                currentUser.getRole()
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Health check for auth service.
     */
    @GetMapping("/health")
    public ResponseEntity<String> authHealth() {
        return ResponseEntity.ok("Auth service is running");
    }

    /**
     * Response DTO for auth info.
     */
    public record AuthResponse(
            String id,
            String username,
            String fullName,
            String role
    ) {}
}