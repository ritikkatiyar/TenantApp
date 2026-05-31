package com.tenantliving.ai.controller;

import com.tenantliving.ai.common.response.ApiResponse;
import com.tenantliving.ai.dto.AICommandDTOs.AICommandRequest;
import com.tenantliving.ai.dto.AICommandDTOs.AICommandResponse;
import com.tenantliving.ai.dto.AICommandDTOs.AIJobCreateRequest;
import com.tenantliving.ai.dto.AICommandDTOs.AIJobCreateResponse;
import com.tenantliving.ai.dto.AICommandDTOs.AIJobStatusResponse;
import com.tenantliving.ai.service.AIService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
@Tag(name = "AI Commands", description = "Endpoints for interacting with the AI Service")
public class AIController {

    private final AIService aiService;

    @PostMapping("/commands")
    @Operation(summary = "Process an AI command synchronously", description = "Sends a prompt to the AI and waits for the response.")
    public ResponseEntity<ApiResponse<AICommandResponse>> processCommand(@Valid @RequestBody AICommandRequest request) {
        return ResponseEntity.ok(ApiResponse.success(aiService.processCommand(request)));
    }

    @PostMapping("/jobs")
    @Operation(summary = "Create an asynchronous AI job", description = "Creates a job to process a prompt in the background and returns a jobId.")
    public ResponseEntity<ApiResponse<AIJobCreateResponse>> createJob(@Valid @RequestBody AIJobCreateRequest request) {
        return ResponseEntity.accepted().body(ApiResponse.success(aiService.createJob(request)));
    }

    @GetMapping("/jobs/{jobId}")
    @Operation(summary = "Get AI job status", description = "Retrieves the status and result of a previously created AI job.")
    public ResponseEntity<ApiResponse<AIJobStatusResponse>> getJobStatus(@PathVariable String jobId) {
        return ResponseEntity.ok(ApiResponse.success(aiService.getJobStatus(UUID.fromString(jobId))));
    }
}
