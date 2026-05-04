package com.tenantliving.auth.service;

import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.user.domain.UserTbl;
import com.tenantliving.user.service.interfaces.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Bridges persisted {@link UserTbl} entities to Spring Security {@link UserDetails}.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserService userService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Loading user by username: {}", username);

        UserTbl user = userService.getUserByEmail(username);

        log.debug("User found: {} with role: {}", user.getFullName(), user.getRole());
        return UserDetailsImpl.fromUser(user);
    }

    public UserDetails loadUserById(String userId) throws UsernameNotFoundException {
        log.debug("Loading user by ID: {}", userId);

        UserTbl user = userService.getUserById(UUID.fromString(userId));

        return UserDetailsImpl.fromUser(user);
    }
}
