package com.tenantliving.auth;

import com.tenantliving.user.User;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

/**
 * Custom UserDetails implementation that wraps our User entity.
 * Used by Spring Security for authentication and authorization.
 */
@Getter
public class UserDetailsImpl implements UserDetails {

    private final String id;
    private final String username;  // Using authUid as username
    private final String password;
    private final String fullName;
    private final String role;
    private final boolean enabled;

    private UserDetailsImpl(String id, String username, String password, 
                           String fullName, String role, boolean enabled) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.fullName = fullName;
        this.role = role;
        this.enabled = enabled;
    }

    /**
     * Create UserDetailsImpl from User entity.
     * Note: Password is not loaded from entity - should be validated via external auth provider.
     * For now, using a placeholder since we're using HTTP Basic with external auth.
     */
    public static UserDetailsImpl fromUser(User user) {
        return new UserDetailsImpl(
                user.getId().toString(),
                user.getAuthUid(),
                "",  // Password handled externally (e.g., Firebase, Auth0)
                user.getFullName(),
                user.getRole().name(),
                true  // enabled = true
        );
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role));
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }

    /**
     * Get the user's actual ID (UUID).
     */
    public String getId() {
        return id;
    }

    /**
     * Get the user's full name.
     */
    public String getFullName() {
        return fullName;
    }

    /**
     * Get the user's role.
     */
    public String getRole() {
        return role;
    }
}