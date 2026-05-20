package com.tenantliving.ai.dto;

import com.fasterxml.jackson.annotation.JsonPropertyDescription;
import java.util.UUID;

public class AITools {

    public record CreatePropertyInput(
            @JsonPropertyDescription("The name of the property to be created (e.g. Sunrise PG, Sunset View)")
            String name,
            
            @JsonPropertyDescription("The city or location address where the property is situated")
            String location
    ) {}

    public record GetFloorSummariesInput(
            @JsonPropertyDescription("The unique UUID of the property")
            UUID propertyId,
            
            @JsonPropertyDescription("Optional maximum floor number to fetch layout summaries through (inclusive)")
            Integer throughFloor
    ) {}

    public record ToolExecutionResponse(
            boolean success,
            String message,
            Object data
    ) {}
}
