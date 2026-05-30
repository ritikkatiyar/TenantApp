package com.tenantliving.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.ai.service")
public record AIServiceProperties(
        String authToken,
        String authHeaderName
) {
}
