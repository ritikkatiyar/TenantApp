package com.tenantliving.ai.service;

import com.tenantliving.ai.dto.AICommandDTOs;
import com.tenantliving.auth.principal.UserDetailsImpl;

import java.util.UUID;

public interface AICommandService {
    AICommandDTOs.AICommandResponse handleCommand(
            AICommandDTOs.AICommandRequest request,
            UserDetailsImpl currentUser
    );

    AICommandDTOs.AICommandResponse queueCommand(
            AICommandDTOs.AICommandRequest request,
            UserDetailsImpl currentUser
    );

    String executeAIJob(UUID jobId, String prompt, UUID userId);

    AICommandDTOs.AIJobStatusResponse getJobStatus(UUID jobId, UserDetailsImpl currentUser);
}
