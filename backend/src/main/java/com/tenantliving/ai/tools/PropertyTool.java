package com.tenantliving.ai.tools;

import com.tenantliving.ai.dto.AITools.CreatePropertyInput;
import com.tenantliving.ai.dto.AITools.ToolExecutionResponse;
import com.tenantliving.auth.principal.UserDetailsImpl;
import com.tenantliving.property.dto.PropertyDTOs;
import com.tenantliving.property.service.interfaces.PropertyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.stereotype.Component;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

/**
 * Tool implementation for creating a property.
 * This class is discovered by Spring AI because it contains a method annotated with @Tool.
 * The bean name (by default) is {@code propertyTool} which matches the name used in
 * {@code AICommandServiceImpl#executeAIJob} when the tools are bound dynamically.
 */
@Component("createPropertyTool")
@RequiredArgsConstructor
@Slf4j
public class PropertyTool {

    private final PropertyService propertyService;

    /**
     * Creates a new property in the system.
     *
     * @param input contains the property name and location supplied by the LLM.
     * @return a {@link ToolExecutionResponse} indicating success or failure.
     */
    @Tool(name = "createPropertyTool",
          description = "Creates a new property/building in the system with a name and location.")
    public ToolExecutionResponse createProperty(CreatePropertyInput input) {
        log.info("[AI TOOL] Executing createPropertyTool: name={}, location={}", input.name(), input.location());
        // Resolve current authenticated user – the same logic used in the original bean.
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !(auth.getPrincipal() instanceof UserDetailsImpl principal)) {
            log.warn("[AI TOOL] No valid authentication context found during property creation");
            return new ToolExecutionResponse(false, "Authentication context unavailable. Action denied.", null);
        }
        UUID creatorId = UUID.fromString(principal.getId());
        UUID ownerId = creatorId; // default owner is creator

        PropertyDTOs.CreatePropertyRequest request = new PropertyDTOs.CreatePropertyRequest(
                input.name(),
                input.location(),
                "Bengaluru", // default city to satisfy DB constraint
                null,        // landmark optional
                5            // default total floors
        );
        try {
            var created = propertyService.createProperty(request, ownerId, creatorId);
            return new ToolExecutionResponse(true,
                    "Property '" + input.name() + "' created successfully with ID: " + created.getId(),
                    created.getId()
            );
        } catch (Exception e) {
            log.error("[AI TOOL] Error creating property", e);
            return new ToolExecutionResponse(false, "Failed to create property: " + e.getMessage(), null);
        }
    }
}
