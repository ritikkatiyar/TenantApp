package com.tenantliving.ai.controller;

import com.tenantliving.ai.dto.AICommandDTOs.AICommandRequest;
import com.tenantliving.ai.dto.AICommandDTOs.AICommandResponse;
import com.tenantliving.ai.dto.AICommandDTOs.AIJobCreateRequest;
import com.tenantliving.ai.dto.AICommandDTOs.AIJobCreateResponse;
import com.tenantliving.ai.dto.AICommandDTOs.AIJobStatusResponse;
import com.tenantliving.ai.service.AIService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AIController {

    private final AIService aiService;

    @PostMapping("/commands")
    @ResponseStatus(HttpStatus.OK)
    public AICommandResponse processCommand(@Valid @RequestBody AICommandRequest request) {
        return aiService.processCommand(request);
    }

    @PostMapping("/jobs")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public AIJobCreateResponse createJob(@Valid @RequestBody AIJobCreateRequest request) {
        return aiService.createJob(request);
    }

    @GetMapping("/jobs/{jobId}")
    @ResponseStatus(HttpStatus.OK)
    public AIJobStatusResponse getJobStatus(@PathVariable String jobId) {
        return aiService.getJobStatus(UUID.fromString(jobId));
    }
}
