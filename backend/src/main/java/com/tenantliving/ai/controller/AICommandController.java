package com.tenantliving.ai.controller;

import com.tenantliving.ai.dto.AICommandDTOs;
import com.tenantliving.ai.service.AICommandService;
import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.billing.annotation.EnforceSubscription;
import com.tenantliving.billing.annotation.SubscriptionFeature;
import com.tenantliving.common.exception.ApiError;
import com.tenantliving.common.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/ai/commands")
@RequiredArgsConstructor
@Tag(name = "AI Commands", description = "Natural-language AI command entrypoint")
@SecurityRequirement(name = "bearerAuth")
public class AICommandController {

    private final AICommandService aiCommandService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_STAFF')")
    @EnforceSubscription(feature = SubscriptionFeature.AI_COMMANDS)
    @Operation(summary = "Run AI command", description = "Sends a natural-language command to the Tenant Living AI assistant.")
    @ApiResponses({
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "200", description = "AI job queued successfully"),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "400", description = "Validation failed",
                    content = @Content(schema = @Schema(implementation = ApiError.class))),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "401", description = "Authentication required", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "403", description = "Insufficient role", content = @Content),
            @io.swagger.v3.oas.annotations.responses.ApiResponse(responseCode = "503", description = "AI disabled or not configured",
                    content = @Content(schema = @Schema(implementation = ApiError.class)))
    })
    public ResponseEntity<ApiResponse<AICommandDTOs.AICommandResponse>> runCommand(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @Valid @RequestBody AICommandDTOs.AICommandRequest request
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        AICommandDTOs.AICommandResponse response = aiCommandService.queueCommand(request, currentUser);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/jobs/{jobId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'PROPERTY_STAFF')")
    @Operation(summary = "Get AI job status", description = "Retrieves the execution status and response of a queued AI command job.")
    public ResponseEntity<ApiResponse<AICommandDTOs.AIJobStatusResponse>> getJobStatus(
            @AuthenticationPrincipal UserDetailsImpl currentUser,
            @PathVariable UUID jobId
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        AICommandDTOs.AIJobStatusResponse response = aiCommandService.getJobStatus(jobId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
