package com.tenantliving.ai.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;

public class AICommandDTOs {

    @Schema(name = "AICommandRequest", description = "Natural language command for the Tenant Living AI assistant")
    public record AICommandRequest(
            @Schema(example = "Create a property named Sunrise PG in Bengaluru near the metro")
            @NotBlank(message = "Message is required")
            String message
    ) {
    }

    @Schema(name = "AICommandResponse", description = "AI assistant response")
    public record AICommandResponse(
            String message,
            String jobId,
            String status
    ) {
    }

    @Schema(name = "AIJobStatusResponse", description = "Current status and result of the AI command job")
    public record AIJobStatusResponse(
            String jobId,
            String status,
            String response,
            String errorMessage
    ) {
    }
}
