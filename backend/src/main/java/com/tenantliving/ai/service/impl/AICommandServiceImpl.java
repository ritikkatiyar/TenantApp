package com.tenantliving.ai.service.impl;

import com.tenantliving.ai.config.AIProperties;
import com.tenantliving.ai.dto.AICommandDTOs;
import com.tenantliving.ai.service.AICommandService;
import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.common.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AICommandServiceImpl implements AICommandService {

    private static final String SYSTEM_PROMPT = """
            You are the Tenant Living AI operations assistant.
            Help landlords and admins operate the Tenant Living property-management system.
            This first version has no backend action tools attached yet.
            Do not claim that you created, updated, deleted, assigned, charged, or notified anything.
            If the user asks for an action, explain what information is needed and say that execution will require a backend tool.
            Ask concise clarification questions when required fields are missing.
            Keep responses practical and focused on property, unit, lease, rent, tenant, and expense workflows.
            """;

    private final AIProperties aiProperties;
    private final ObjectProvider<ChatClient.Builder> chatClientBuilderProvider;

    @Override
    public AICommandDTOs.AICommandResponse handleCommand(
            AICommandDTOs.AICommandRequest request,
            UserDetailsImpl currentUser
    ) {
        if (!aiProperties.enabled()) {
            throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "AI assistant is disabled");
        }

        ChatClient.Builder chatClientBuilder = chatClientBuilderProvider.getIfAvailable();
        if (chatClientBuilder == null) {
            throw new BusinessException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI chat model is not configured"
            );
        }

        String userContext = currentUser != null
                ? "Current user: id=%s, email=%s, name=%s".formatted(
                        currentUser.getId(),
                        currentUser.getUsername(),
                        currentUser.getFullName()
                )
                : "Current user: unavailable";

        String content;
        try {
            content = chatClientBuilder.build()
                    .prompt()
                    .system(SYSTEM_PROMPT + "\n" + userContext)
                    .user(request.message())
                    .call()
                    .content();
        } catch (Exception exception) {
            log.warn("AI command failed: {}", exception.getMessage(), exception);
            throw new BusinessException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "AI provider request failed: " + exception.getMessage()
            );
        }

        return new AICommandDTOs.AICommandResponse(content);
    }
}
