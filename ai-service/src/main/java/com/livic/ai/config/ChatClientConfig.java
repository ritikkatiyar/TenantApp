package com.livic.ai.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.ChatClient.Builder;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.livic.ai.tools.PropertyTool;

@Configuration
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.ai.enabled", havingValue = "true")
public class ChatClientConfig {

    private final Builder chatClientBuilder;
    private final PropertyTool propertyTool;

    @Bean
    public ChatClient chatClient() {
        log.info("[AI CONFIG] Building shared ChatClient with PropertyTool");
        return chatClientBuilder
                .defaultTools(propertyTool)
                .build();
    }
}
