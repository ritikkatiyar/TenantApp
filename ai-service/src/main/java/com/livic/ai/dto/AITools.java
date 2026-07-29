package com.livic.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public final class AITools {

    private AITools() {}

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreatePropertyInput {
        @com.fasterxml.jackson.annotation.JsonProperty(required = true)
        @com.fasterxml.jackson.annotation.JsonPropertyDescription("The name of the property or building")
        private String name;

        @com.fasterxml.jackson.annotation.JsonProperty(required = true)
        @com.fasterxml.jackson.annotation.JsonPropertyDescription("The full street address of the property")
        private String address;

        @com.fasterxml.jackson.annotation.JsonProperty(required = true)
        @com.fasterxml.jackson.annotation.JsonPropertyDescription("The city where the property is located. If not mentioned, ask the user.")
        private String city;

        @com.fasterxml.jackson.annotation.JsonPropertyDescription("An optional landmark near the property")
        private String landmark;

        @com.fasterxml.jackson.annotation.JsonProperty(required = true)
        @com.fasterxml.jackson.annotation.JsonPropertyDescription("The total number of floors in the property. If not mentioned, ask the user.")
        private Integer totalFloors;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ToolExecutionResponse {
        private boolean success;
        private String message;
        private String referenceId;
    }
}
