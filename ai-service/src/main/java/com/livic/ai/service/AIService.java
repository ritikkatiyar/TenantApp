package com.livic.ai.service;

import com.livic.ai.dto.AICommandDTOs.AICommandRequest;
import com.livic.ai.dto.AICommandDTOs.AICommandResponse;
import com.livic.ai.dto.AICommandDTOs.AIJobCreateRequest;
import com.livic.ai.dto.AICommandDTOs.AIJobCreateResponse;
import com.livic.ai.dto.AICommandDTOs.AIJobStatusResponse;

import java.util.UUID;

public interface AIService {

    AICommandResponse processCommand(AICommandRequest request);

    AIJobCreateResponse createJob(AIJobCreateRequest request);

    AIJobStatusResponse getJobStatus(UUID jobId);
}
