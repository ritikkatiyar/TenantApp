package com.tenantliving.ai.client;

import com.tenantliving.ai.config.BackendClientProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
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
                .uri(uriBuilder -> uriBuilder.path("/api/v1/property/properties").queryParam("ownerId", ownerId.toString()).build());

        if (StringUtils.hasText(properties.authToken())) {
            req = req.header(HttpHeaders.AUTHORIZATION, "Bearer " + properties.authToken());
        }

        return req
                .bodyValue(payload)
                .retrieve()
                .bodyToMono(Map.class)
                .block();
    }
}
