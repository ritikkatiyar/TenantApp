package com.tenantliving.ai.service;

import com.tenantliving.ai.dto.AICommandDTOs.AICommandRequest;
import com.tenantliving.ai.dto.AICommandDTOs.AICommandResponse;
import com.tenantliving.ai.dto.AICommandDTOs.AIJobCreateRequest;
import com.tenantliving.ai.dto.AICommandDTOs.AIJobCreateResponse;
import com.tenantliving.ai.dto.AICommandDTOs.AIJobStatusResponse;

import java.util.UUID;

public interface AIService {

    AICommandResponse processCommand(AICommandRequest request);

    AIJobCreateResponse createJob(AIJobCreateRequest request);

    AIJobStatusResponse getJobStatus(UUID jobId);
}
