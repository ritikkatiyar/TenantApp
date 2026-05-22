package com.tenantliving.ai.service.impl;

import com.tenantliving.ai.config.AIProperties;
import com.tenantliving.ai.config.RedisStreamConfig;
import com.tenantliving.ai.domain.AIJobTbl;
import com.tenantliving.ai.dto.AICommandDTOs;
import com.tenantliving.ai.repository.AIJobRepository;
import com.tenantliving.ai.service.AICommandService;
import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.auth.service.CustomUserDetailsService;

import com.tenantliving.common.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;

import org.springframework.data.redis.connection.stream.StreamRecords;
import org.springframework.data.redis.connection.stream.StringRecord;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
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
    @Autowired(required = false)  // ← ChatClient may not exist when AI is disabled
    private ChatClient chatClient;
    private final AIJobRepository aiJobRepository;
    private final StringRedisTemplate stringRedisTemplate;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public AICommandDTOs.AICommandResponse handleCommand(
            AICommandDTOs.AICommandRequest request,
            UserDetailsImpl currentUser
    ) {
        if (!aiProperties.enabled()) {
            throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "AI assistant is disabled");
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
            content = chatClient.prompt()
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

        return new AICommandDTOs.AICommandResponse(content, null, "COMPLETED");
    }

    @Override
    public AICommandDTOs.AICommandResponse queueCommand(
            AICommandDTOs.AICommandRequest request,
            UserDetailsImpl currentUser
    ) {
        if (!aiProperties.enabled()) {
            throw new BusinessException(HttpStatus.SERVICE_UNAVAILABLE, "AI assistant is disabled");
        }

        // 1. Create AIJob entity in PENDING status
        AIJobTbl job = AIJobTbl.builder()
                .userId(UUID.fromString(currentUser.getId()))
                .prompt(request.message())
                .status("PENDING")
                .build();
        job = aiJobRepository.save(job);

        // 2. Publish message to Redis Stream
        try {
            Map<String, String> body = new HashMap<>();
            body.put("jobId", job.getId().toString());
            body.put("prompt", request.message());
            body.put("userId", currentUser.getId());

            StringRecord record = StreamRecords.string(body)
                    .withStreamKey(RedisStreamConfig.STREAM_KEY);

            stringRedisTemplate.opsForStream().add(record);
            log.info("[AI SERVICE] AI job published to Redis Stream: jobId={}, prompt={}", job.getId(), request.message());

        } catch (Exception e) {
            log.error("[AI SERVICE] Failed to publish job to Redis Stream: jobId={}", job.getId(), e);
            job.setStatus("FAILED");
            job.setErrorMessage("Redis queue failure: " + e.getMessage());
            aiJobRepository.save(job);
            throw new BusinessException(HttpStatus.INTERNAL_SERVER_ERROR, "Queueing failed: " + e.getMessage());
        }

        return new AICommandDTOs.AICommandResponse(
                "Processing your command in the background. Please poll for results.",
                job.getId().toString(),
                "PENDING"
        );
    }

    @Override
    public String executeAIJob(UUID jobId, String prompt, UUID userId) {
        // Establish authentication security context on the background execution thread
        UserDetailsImpl principal = (UserDetailsImpl) userDetailsService.loadUserById(userId.toString());
        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        String userContext = "Current user: id=%s, email=%s, name=%s".formatted(
                principal.getId(),
                principal.getUsername(),
                principal.getFullName()
        );

        String content;
        try {
            content = chatClient.prompt()
                    .system(SYSTEM_PROMPT + "\n" + userContext)
                    .user(prompt)
                    .call()
                    .content();
        } finally {
            // Ensure thread context cleanup
            SecurityContextHolder.clearContext();
        }

        return content;
    }

    @Override
    public AICommandDTOs.AIJobStatusResponse getJobStatus(UUID jobId) {
        AIJobTbl job = aiJobRepository.findById(jobId)
                .orElseThrow(() -> new BusinessException(HttpStatus.NOT_FOUND, "AI job not found"));

        return new AICommandDTOs.AIJobStatusResponse(
                job.getId().toString(),
                job.getStatus(),
                job.getResponse(),
                job.getErrorMessage()
        );
    }
}
