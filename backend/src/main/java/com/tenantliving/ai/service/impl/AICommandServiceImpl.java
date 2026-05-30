package com.tenantliving.ai.service.impl;

import com.tenantliving.ai.client.AIServiceClient;
import com.tenantliving.ai.config.AIProperties;
import com.tenantliving.ai.dto.AICommandDTOs;
import com.tenantliving.ai.service.AICommandService;
import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.common.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class AICommandServiceImpl implements AICommandService {

    private static final String SYSTEM_PROMPT = """
            You are the Tenant Living AI operations assistant.
            Help landlords and admins operate the Tenant Living property-management system.
            You are integrated with backend tool executions. When the user asks you to perform an action (like creating a property), use your tools.
            If a tool execution fails or returns an error, convey the message clearly to the user.
            Ask concise clarification questions when required fields are missing.
            Keep responses practical and focused on property, unit, lease, rent, tenant, and expense workflows.
            """;

    private final AIProperties aiProperties;
    private final AIServiceClient aiServiceClient;

    @Override
    public AICommandDTOs.AICommandResponse handleCommand(
            AICommandDTOs.AICommandRequest request,
            UserDetailsImpl currentUser
    ) {
        throw new UnsupportedOperationException("Direct AI command processing is not supported by the backend. Use queueCommand instead.");
    }

    @Override
    public AICommandDTOs.AICommandResponse queueCommand(
            AICommandDTOs.AICommandRequest request,
            UserDetailsImpl currentUser
    ) {
        if (!aiProperties.enabled()) {
            throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "AI assistant is disabled");
        }

        return aiServiceClient.queueCommand(request, currentUser.getId());
    }

    @Override
    public String executeAIJob(UUID jobId, String prompt, UUID userId) {
        throw new UnsupportedOperationException("Background execution is now handled by ai-service");
    }

    @Override
    public AICommandDTOs.AIJobStatusResponse getJobStatus(UUID jobId, UserDetailsImpl currentUser) {
        return aiServiceClient.getJobStatus(jobId, currentUser != null ? currentUser.getId() : null);
    }
}
