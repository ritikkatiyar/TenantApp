package com.livic.auth.service;

import com.livic.auth.principal.UserDetailsImpl;
import com.livic.user.domain.UserTbl;
import com.livic.user.service.interfaces.UserQueryService;
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

    private final UserQueryService userQueryService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Loading user by username: {}", username);

        UserTbl user = userQueryService.getUserByEmail(username);

        log.debug("User found: {}", user.getFullName());
        return UserDetailsImpl.fromUser(user);
    }

    public UserDetails loadUserById(String userId) throws UsernameNotFoundException {
        log.debug("Loading user by ID: {}", userId);

        UserTbl user = userQueryService.getUserById(UUID.fromString(userId));

        return UserDetailsImpl.fromUser(user);
    }
}
