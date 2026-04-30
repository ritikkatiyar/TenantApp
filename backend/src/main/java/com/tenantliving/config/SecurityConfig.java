package com.tenantliving.config;

import com.tenantliving.auth.CustomUserDetailsService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Security configuration for the Tenant Living application.
 * 
 * Authentication:
 * - Uses HTTP Basic Auth for development
 * - In production, should integrate with Firebase/Auth0 JWT validation
 * 
 * Authorization:
 * - SUPER_ADMIN: Primary Landlord (full property access)
 * - ADMIN: Secondary Owner (co-owner access)
 * - PROPERTY_STAFF: Staff (limited access)
 * - USER: Tenant (minimal access)
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final CustomUserDetailsService customUserDetailsService;

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            CorsConfigurationSource corsConfigurationSource
    ) throws Exception {
        return http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // Health check - public
                        .requestMatchers(HttpMethod.GET, "/health").permitAll()
                        // Auth endpoints - public for login
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        // Property management - requires authentication
                        .requestMatchers("/api/v1/properties/**").authenticated()
                        // All other requests require authentication
                        .anyRequest().authenticated()
                )
                .httpBasic(Customizer.withDefaults())
                .build();
    }

    /**
     * Authentication manager that uses our UserDetailsService.
     */
    @Bean
    public ProviderManager authenticationManager() {
        var provider = new org.springframework.security.authentication.dao.DaoAuthenticationProvider(customUserDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return new ProviderManager(provider);
    }

    /**
     * Password encoder.
     * Note: In production with Firebase/Auth0, this won't be used for login
     * but is required by Spring Security infrastructure.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
