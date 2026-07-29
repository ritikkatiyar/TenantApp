package com.livic.ai.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app.backend.client")
public record BackendClientProperties(
        String baseUrl
) {}
