package com.livic.ai.events;

import org.springframework.context.ApplicationEvent;

import java.util.UUID;

public class AIJobCreatedEvent extends ApplicationEvent {

    private final UUID jobId;

    public AIJobCreatedEvent(Object source, UUID jobId) {
        super(source);
        this.jobId = jobId;
    }

    public UUID getJobId() {
        return jobId;
    }
}
