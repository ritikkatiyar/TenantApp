package com.tenantliving;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class TenantLivingApplication {

    public static void main(String[] args) {
        SpringApplication.run(TenantLivingApplication.class, args);
    }
}
