package com.tenantliving.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

public final class AICommandDTOs {

    private AICommandDTOs() {
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AICommandRequest {
        @NotBlank
        private String message;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AICommandResponse {
        private String message;
        private String jobId;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AIJobCreateRequest {
        @NotBlank
        private String message;
        @NotBlank
        private String userId;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AIJobCreateResponse {
        private String jobId;
        private String status;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class AIJobStatusResponse {
        private String jobId;
        private String status;
        private String response;
        private String errorMessage;
    }
}
