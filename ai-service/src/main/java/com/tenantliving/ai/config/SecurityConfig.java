package com.tenantliving.ai.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, AIServiceProperties properties) throws Exception {
        http.csrf(csrf -> csrf.disable());

        if (StringUtils.hasText(properties.authToken())) {
            http.authorizeHttpRequests(requests -> requests
                            .anyRequest().authenticated()
                    )
                    .addFilterBefore(new InternalServiceAuthFilter(properties), UsernamePasswordAuthenticationFilter.class);
        } else {
            http.authorizeHttpRequests(requests -> requests
                    .anyRequest().permitAll()
            );
        }

        return http.build();
    }

    private static class InternalServiceAuthFilter extends OncePerRequestFilter {

        private final AIServiceProperties properties;

        private InternalServiceAuthFilter(AIServiceProperties properties) {
            this.properties = properties;
        }

        @Override
        protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                throws ServletException, IOException {
            String authorization = request.getHeader("Authorization");
            String expected = "Bearer " + properties.authToken();

            if (!StringUtils.hasText(authorization) || !authorization.equals(expected)) {
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Unauthorized");
                return;
            }

            SecurityContextHolder.getContext().setAuthentication(
                    new UsernamePasswordAuthenticationToken(
                            "internal-service",
                            null,
                            AuthorityUtils.createAuthorityList("ROLE_INTERNAL_SERVICE")
                    )
            );

            filterChain.doFilter(request, response);
        }
    }
}
