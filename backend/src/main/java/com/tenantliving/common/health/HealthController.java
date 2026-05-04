package com.tenantliving.common.health;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@Tag(name = "Platform", description = "Health and infrastructure endpoints")
public class HealthController {

    @GetMapping(value = "/health", produces = MediaType.TEXT_PLAIN_VALUE)
    @Operation(summary = "Application health", description = "Public liveness probe; returns plain text.")
    @ApiResponse(responseCode = "200", description = "OK",
            content = @Content(schema = @Schema(type = "string", example = "OK")))
    public String health() {
        return "OK";
    }
}
