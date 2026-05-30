package com.tenantliving.ai;

import com.tenantliving.ai.config.AIProperties;
import com.tenantliving.ai.config.AIServiceProperties;
import com.tenantliving.ai.config.BackendClientProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;

@SpringBootApplication
@EnableAsync
@EnableConfigurationProperties({AIProperties.class, AIServiceProperties.class, BackendClientProperties.class})
public class Application {

    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
