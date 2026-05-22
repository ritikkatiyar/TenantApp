package com.tenantliving.ai.listener;

import com.tenantliving.ai.config.RedisStreamConfig;
import com.tenantliving.ai.domain.AIJobTbl;
import com.tenantliving.ai.repository.AIJobRepository;
import com.tenantliving.ai.service.AICommandService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.connection.stream.MapRecord;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.stream.StreamListener;
import org.springframework.stereotype.Component;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;

import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
@ConditionalOnProperty(name = "app.ai.enabled", havingValue = "true")
public class AICommandStreamListener implements StreamListener<String, MapRecord<String, String, String>> {

    private final AIJobRepository aiJobRepository;
    private final AICommandService aiCommandService;
    private final StringRedisTemplate stringRedisTemplate;

    @Override
    public void onMessage(MapRecord<String, String, String> record) {
        String jobIdStr = record.getValue().get("jobId");
        String prompt = record.getValue().get("prompt");
        String userIdStr = record.getValue().get("userId");

        log.info("[REDIS WORKER] Received AI command job: jobId={}, prompt={}", jobIdStr, prompt);

        if (jobIdStr == null || prompt == null || userIdStr == null) {
            log.warn("[REDIS WORKER] Invalid stream record content, skipping.");
            return;
        }

        try {
            UUID jobId = UUID.fromString(jobIdStr);
            UUID userId = UUID.fromString(userIdStr);

            AIJobTbl job = aiJobRepository.findById(jobId).orElse(null);
            if (job != null) {
                job.setStatus("PROCESSING");
                aiJobRepository.save(job);

                try {
                    // Call service to run Gemini LLM + Tool Callings
                    String aiResponse = aiCommandService.executeAIJob(jobId, prompt, userId);
                    
                    job.setStatus("COMPLETED");
                    job.setResponse(aiResponse);
                } catch (Exception e) {
                    log.error("[REDIS WORKER] Failed to process AI command job: jobId={}", jobId, e);
                    job.setStatus("FAILED");
                    job.setErrorMessage(e.getMessage() != null ? e.getMessage() : "Unknown execution error");
                }
                aiJobRepository.save(job);
            }

            // Send Acknowledgment (ACK)
            stringRedisTemplate.opsForStream().acknowledge(
                    RedisStreamConfig.STREAM_KEY,
                    RedisStreamConfig.GROUP_NAME,
                    record.getId()
            );

        } catch (Exception e) {
            log.error("[REDIS WORKER] Exception occurred in message listener: recordId={}", record.getId(), e);
        }
    }
}
