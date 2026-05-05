package com.tenantliving.auth.principal;

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
    private final String role;
    private final boolean enabled;
    private final boolean accountNonLocked;

    private UserDetailsImpl(String id, String username, String password,
                           String fullName, String role, boolean enabled,
                           boolean accountNonLocked) {
        this.id = id;
        this.username = username;
        this.password = password;
        this.fullName = fullName;
        this.role = role;
        this.enabled = enabled;
        this.accountNonLocked = accountNonLocked;
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
                user.getRole().name(),
                true,
                accountNonLocked
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
