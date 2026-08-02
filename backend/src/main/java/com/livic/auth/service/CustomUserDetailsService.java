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

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserQueryService userQueryService;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Loading user by username: {}", username);

        return userQueryService.findByEmail(username)
                .map(user -> {
                    log.debug("User found: {}", user.getFullName());
                    return (UserDetails) UserDetailsImpl.fromUser(user);
                })
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + username));
    }

    public UserDetails loadUserById(String userId) throws UsernameNotFoundException {
        log.debug("Loading user by ID: {}", userId);
        try {
            UserTbl user = userQueryService.getUserById(UUID.fromString(userId));
            return (UserDetails) UserDetailsImpl.fromUser(user);
        } catch (Exception e) {
            throw new UsernameNotFoundException("User not found with id: " + userId, e);
        }
    }
}
