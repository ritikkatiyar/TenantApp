package com.tenantliving.ai.tools;

import com.tenantliving.ai.config.AIJobContext;
import com.tenantliving.ai.dto.AITools.CreatePropertyInput;
import com.tenantliving.ai.dto.AITools.ToolExecutionResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;
import com.tenantliving.ai.client.BackendAdminClient;

import java.util.UUID;

@Component("createPropertyTool")
@RequiredArgsConstructor
@Slf4j
public class PropertyTool {

    private final BackendAdminClient backendAdminClient;

    @Tool(name = "createPropertyTool",
          description = "Creates a new property/building in the system with a name and location.")
    public ToolExecutionResponse createProperty(CreatePropertyInput input) {
        log.info("[AI TOOL] (ai-service) Received createPropertyTool request: name={}, location={}", input.getName(), input.getLocation());

        // Resolve the actual userId from the job context (set by AIJobEventListener)
        UUID ownerId = AIJobContext.getUserId();
        if (ownerId == null) {
            log.warn("[AI TOOL] No userId in AIJobContext — cannot determine property owner");
            return new ToolExecutionResponse(false, "Cannot determine the property owner. Please try again.", null);
        }

        try {
            var response = backendAdminClient.createProperty(ownerId, input.getName(), input.getLocation(), "Unknown City", "", 3);
            String ref = response != null && response.containsKey("data") ? response.get("data").toString() : UUID.randomUUID().toString();
            String message = "Property '" + input.getName() + "' created successfully. Reference: " + ref;
            return new ToolExecutionResponse(true, message, ref);
        } catch (Exception e) {
            log.error("[AI TOOL] Error calling backend admin API", e);
            return new ToolExecutionResponse(false, "Failed to create property: " + e.getMessage(), null);
        }
    }
}
