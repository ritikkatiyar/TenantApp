package com.tenantliving.ai.config;

import com.tenantliving.ai.listener.AICommandStreamListener;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.connection.stream.Consumer;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.connection.stream.ReadOffset;
import org.springframework.data.redis.connection.stream.StreamOffset;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.stream.StreamMessageListenerContainer;
import org.springframework.data.redis.stream.Subscription;

import java.time.Duration;

@Configuration
public class RedisStreamConfig {

    public static final String STREAM_KEY = "ai:commands:stream";
    public static final String GROUP_NAME = "ai-group";

    @Bean
    @ConditionalOnProperty(name = "app.ai.enabled", havingValue = "true")
    public Subscription subscription(
            RedisConnectionFactory redisConnectionFactory,
            StringRedisTemplate redisTemplate,
            AICommandStreamListener listener
    ) {
        // Pro-actively ensure Stream and Group exist
        try {
            redisTemplate.opsForStream().createGroup(STREAM_KEY, GROUP_NAME);
        } catch (Exception e) {
            // Ignore if group or stream already exists
        }

        StreamMessageListenerContainer.StreamMessageListenerContainerOptions<String, MapRecord<String, String, String>> options =
                StreamMessageListenerContainer.StreamMessageListenerContainerOptions.builder()
                        .pollTimeout(Duration.ofSeconds(1))
                        .build();

        StreamMessageListenerContainer<String, MapRecord<String, String, String>> container =
                StreamMessageListenerContainer.create(redisConnectionFactory, options);

        Subscription subscription = container.receive(
                Consumer.from(GROUP_NAME, "ai-consumer-1"),
                StreamOffset.create(STREAM_KEY, ReadOffset.lastConsumed()),
                listener
        );

        container.start();
        return subscription;
    }
}
