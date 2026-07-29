package com.livic.ai.listener;

import com.livic.ai.config.AIJobContext;
import com.livic.ai.events.AIJobCreatedEvent;
import com.livic.ai.service.impl.AIServiceImpl;
import com.livic.ai.repository.AIJobRepository;
import com.livic.ai.domain.AIJobTbl;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.context.event.EventListener;

import java.time.LocalDateTime;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import org.springframework.context.ApplicationEventPublisher;

@Component
@RequiredArgsConstructor
@Slf4j
public class AIJobEventListener {

    private final AIServiceImpl aiService;
    private final AIJobRepository aiJobRepository;
    private final ApplicationEventPublisher eventPublisher;

    private static final int MAX_RETRIES = 3;
    private static final ScheduledExecutorService SCHEDULER = Executors.newScheduledThreadPool(2);

    @Async
    @EventListener
    public void onAIJobCreated(AIJobCreatedEvent event) {
        log.info("AI job event received: {}", event.getJobId());
        aiService.markJobProcessing(event.getJobId());

        // Resolve the userId from the persisted job and set it in the thread-local context
        AIJobTbl job = aiJobRepository.findById(event.getJobId()).orElse(null);
        if (job == null) {
            log.error("AI job not found: {}", event.getJobId());
            return;
        }
        AIJobContext.setUserId(job.getUserId());
        AIJobContext.setUserToken(job.getUserToken());

        try {
            String response = aiService.executeJob(event.getJobId());
            aiService.completeJob(event.getJobId(), response);
        } catch (Exception ex) {
            log.error("AI job processing failed for {}", event.getJobId(), ex);

            int retries = job.getRetryCount() == null ? 0 : job.getRetryCount();
            if (retries < MAX_RETRIES) {
                int next = retries + 1;
                job.setRetryCount(next);
                job.setStatus("RETRY_SCHEDULED");
                job.setErrorMessage(ex.getMessage());
                job.setUpdatedAt(LocalDateTime.now());
                aiJobRepository.save(job);

                long delaySeconds = 5L * next;
                log.info("Scheduling retry #{} for job {} in {}s", next, job.getId(), delaySeconds);
                SCHEDULER.schedule(() -> {
                    log.info("Publishing retry event for job {}", job.getId());
                    eventPublisher.publishEvent(new AIJobCreatedEvent(this, job.getId()));
                }, delaySeconds, TimeUnit.SECONDS);
            } else {
                aiService.failJob(event.getJobId(), ex.getMessage());
            }
        } finally {
            AIJobContext.clear();
        }
    }
}
