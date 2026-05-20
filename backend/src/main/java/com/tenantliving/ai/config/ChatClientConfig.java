package com.tenantliving.ai.config;

import com.tenantliving.ai.tools.PropertyTool;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.ChatClient.Builder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Centralised ChatClient configuration.
 *
 * All AI services should inject this bean instead of constructing a ChatClient
 * builder themselves. The PropertyTool is registered here so it is available to
 * every AI request.
 */
@Configuration
@RequiredArgsConstructor
@Slf4j
public class ChatClientConfig {

    private final Builder chatClientBuilder;
    private final PropertyTool propertyTool;

    @Bean
    public ChatClient chatClient() {
        log.info("[AI CONFIG] Building shared ChatClient with PropertyTool");
        return chatClientBuilder
                .defaultTools(propertyTool) // register the declarative @Tool bean
                .build();
    }
}
