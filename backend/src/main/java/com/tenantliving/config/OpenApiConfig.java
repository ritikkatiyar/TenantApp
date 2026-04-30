package com.tenantliving.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI (Swagger) configuration for API documentation.
 * 
 * Access the API documentation at: http://localhost:8080/swagger-ui.html
 * Access the OpenAPI JSON at: http://localhost:8080/v3/api-docs
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI tenantLivingOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("Tenant Living API")
                        .description("""
                                ## Overview
                                Backend API for the Tenant Living property management system.
                                
                                ## Authentication
                                - **Development**: HTTP Basic Auth
                                - **Production**: Firebase/Auth0 JWT (planned)
                                
                                ## Role Hierarchy
                                | Role | Description |
                                |------|-------------|
                                | SUPER_ADMIN | Primary Landlord - owns properties |
                                | ADMIN | Secondary Owner - co-owner/manager |
                                | PROPERTY_STAFF | Staff - day-to-day operations |
                                | USER | Tenant - rents rooms |
                                
                                ## Rate Limits
                                - Default: 100 requests per minute
                                """)
                        .version("1.0.0")
                        .contact(new Contact()
                                .name("Tenant Living Team")
                                .email("dev@tenantliving.com"))
                        .license(new License()
                                .name("Proprietary")
                                .url("https://tenantliving.com")))
                .addSecurityItem(new SecurityRequirement().addList("basicAuth"))
                .components(new Components()
                        .addSecuritySchemes("basicAuth", new SecurityScheme()
                                .type(SecurityScheme.Type.HTTP)
                                .scheme("basic")
                                .description("HTTP Basic Authentication for development")));
    }
}