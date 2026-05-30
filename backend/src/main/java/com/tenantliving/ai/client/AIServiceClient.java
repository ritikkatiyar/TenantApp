package com.tenantliving.ai.client;

import com.tenantliving.ai.config.AIServiceProperties;
import com.tenantliving.ai.dto.AICommandDTOs;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.UUID;

@Component
@RequiredArgsConstructor
public class AIServiceClient {

    private final WebClient.Builder webClientBuilder;
    private final AIServiceProperties properties;

    public AICommandDTOs.AICommandResponse queueCommand(AICommandDTOs.AICommandRequest request, String userId) {
        AICommandDTOs.AIJobCreateRequest jobRequest = new AICommandDTOs.AIJobCreateRequest(request.message(), userId);

        AICommandDTOs.AIJobCreateResponse response = createWebClient(userId)
                .post()
                .uri("/api/v1/ai/jobs")
                .bodyValue(jobRequest)
                .retrieve()
                .bodyToMono(AICommandDTOs.AIJobCreateResponse.class)
                .block();

        String message = "Processing your command in the background. Please poll for results.";
        return new AICommandDTOs.AICommandResponse(message, response.jobId(), response.status());
    }

    public AICommandDTOs.AIJobStatusResponse getJobStatus(UUID jobId, String userId) {
        return createWebClient(userId)
                .get()
                .uri("/api/v1/ai/jobs/{jobId}", jobId)
                .retrieve()
                .bodyToMono(AICommandDTOs.AIJobStatusResponse.class)
                .block();
    }

    private WebClient createWebClient(String userId) {
        WebClient client = webClientBuilder.baseUrl(properties.baseUrl()).build();
        return client.mutate()
                .defaultHeaders(headers -> {
                    if (StringUtils.hasText(properties.authToken())) {
                        headers.set(HttpHeaders.AUTHORIZATION, "Bearer " + properties.authToken());
                    }
                    if (StringUtils.hasText(properties.userHeaderName()) && StringUtils.hasText(userId)) {
                        headers.set(properties.userHeaderName(), userId);
                    }
                })
                .build();
    }
}
