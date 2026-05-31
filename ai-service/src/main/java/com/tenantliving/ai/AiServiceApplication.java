package com.tenantliving.ai;

import com.tenantliving.ai.config.AIProperties;
import com.tenantliving.ai.config.BackendClientProperties;
import com.tenantliving.ai.config.JwtProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EnableConfigurationProperties({AIProperties.class, BackendClientProperties.class, JwtProperties.class})
public class AiServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiServiceApplication.class, args);
    }
}
