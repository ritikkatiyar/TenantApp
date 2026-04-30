package com.tenantliving.auth;

import com.tenantliving.user.User;
import com.tenantliving.user.UserRepo;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Custom UserDetailsService that loads users from our database.
 * Integrates with Spring Security for authentication.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepo userRepository;

    /**
     * Load user by username (authUid).
     * This method is called by Spring Security during authentication.
     * 
     * @param username The username (authUid) to search for
     * @return UserDetails implementation for the user
     * @throws UsernameNotFoundException if user is not found
     */
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        log.debug("Loading user by username: {}", username);
        
        User user = userRepository.findByAuthUid(username)
                .orElseThrow(() -> {
                    log.warn("User not found with authUid: {}", username);
                    return new UsernameNotFoundException("User not found: " + username);
                });

        log.debug("User found: {} with role: {}", user.getFullName(), user.getRole());
        return UserDetailsImpl.fromUser(user);
    }

    /**
     * Load user by ID (UUID).
     * Useful for getting user details after authentication.
     * 
     * @param userId The user's UUID as string
     * @return UserDetails implementation for the user
     * @throws UsernameNotFoundException if user is not found
     */
    public UserDetails loadUserById(String userId) throws UsernameNotFoundException {
        log.debug("Loading user by ID: {}", userId);
        
        User user = userRepository.findById(java.util.UUID.fromString(userId))
                .orElseThrow(() -> {
                    log.warn("User not found with ID: {}", userId);
                    return new UsernameNotFoundException("User not found with ID: " + userId);
                });

        return UserDetailsImpl.fromUser(user);
    }
}