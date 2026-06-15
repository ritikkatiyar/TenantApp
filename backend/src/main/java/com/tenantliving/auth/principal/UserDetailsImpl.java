package com.tenantliving.auth.principal;

import com.tenantliving.common.domain.UserRole;
import com.tenantliving.user.domain.UserTbl;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.Instant;
import java.util.Collection;
import java.util.List;

/**
 * Spring Security {@link UserDetails} adapter for the {@link UserTbl} entity.
 * Separates persistence shape from the security principal (interface segregation).
 */
@Getter
public class UserDetailsImpl implements UserDetails {

    private final String id;
    private final String username;
    private final String password;
    private final String fullName;
    private final boolean enabled;
    private final boolean accountNonLocked;
    private final List<GrantedAuthority> authorities;

    private UserDetailsImpl(String id, String username, String password,
                           String fullName, boolean enabled,
                           boolean accountNonLocked,
                           List<GrantedAuthority> authorities) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.fullName = fullName;
        this.enabled = enabled;
        this.accountNonLocked = accountNonLocked;
        this.authorities = authorities;
    }

    /**
     * {@code username} is the normalized email stored in {@code User.authUid}.
     * Password hash is used by DAO authentication for login; Bearer access uses
     * {@link com.tenantliving.auth.security.JwtAuthenticationFilter}.
     */
    public static UserDetailsImpl fromUser(UserTbl user) {
        String hash = user.getPasswordHash() != null ? user.getPasswordHash() : "";
        boolean accountNonLocked = user.getLockoutUntil() == null || !user.getLockoutUntil().isAfter(Instant.now());
        return new UserDetailsImpl(
                user.getId().toString(),
                user.getAuthUid(),
                hash,
                user.getFullName(),
                true,
                accountNonLocked,
                authoritiesFor(user)
        );
    }

    public static UserDetailsImpl fromClaims(String id, String email, String role) {
        return new UserDetailsImpl(
                id,
                email,
                "", // Password not needed for token auth
                "", // Full name not strictly needed for auth filter
                true,
                true,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
    }

    private static List<GrantedAuthority> authoritiesFor(UserTbl user) {
        UserRole role = user.getGlobalRole() != null ? user.getGlobalRole() : UserRole.USER;
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    public boolean hasGlobalRole(String roleName) {
        return authorities.stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + roleName));
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
        return accountNonLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
}
