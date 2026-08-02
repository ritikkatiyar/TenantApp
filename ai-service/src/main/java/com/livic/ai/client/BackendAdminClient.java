package com.livic.ai.client;

import com.livic.ai.config.BackendClientProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;
import java.util.UUID;

import lombok.extern.slf4j.Slf4j;

@Component
@RequiredArgsConstructor
@Slf4j
public class BackendAdminClient {

    private final WebClient.Builder webClientBuilder;
    private final BackendClientProperties properties;

    public Map<String, Object> createProperty(UUID ownerId, String name, String address, String city, String landmark, int totalFloors) {
        var payload = Map.of(
                "name", name,
                "address", address,
                "city", city,
                "landmark", landmark,
                "totalFloors", totalFloors
        );

        WebClient client = webClientBuilder.baseUrl(properties.baseUrl()).build();
        WebClient.RequestBodySpec req = client.post()
                .uri(uriBuilder -> uriBuilder.path("/api/v1/properties").queryParam("ownerId", ownerId.toString()).build());

        String tokenToUse = com.livic.ai.config.AIJobContext.getUserToken();
        if (StringUtils.hasText(tokenToUse)) {
            req = req.header(HttpHeaders.AUTHORIZATION, "Bearer " + tokenToUse);
        } else {
            // Log a warning if strict token relaying fails
            log.warn("No user token found in AIJobContext for tool call to {}", req);
        }

        return req
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }
}
