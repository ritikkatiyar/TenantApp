package com.tenantliving.ai.dto;

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
        private String name;
        private String location;
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
